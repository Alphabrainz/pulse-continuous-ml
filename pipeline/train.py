import os
import sys
import json
import logging
from datetime import datetime, timezone
from typing import Tuple, List, Dict, Any, Optional

import numpy as np
import pandas as pd
import joblib
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
from huggingface_hub import HfApi

import firebase_admin
from firebase_admin import credentials, firestore

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [TRAIN-%(levelname)s] %(message)s"
)
logger = logging.getLogger("continuous_training")

# Load environment variables
load_dotenv()

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", os.getenv("VITE_FIREBASE_PROJECT_ID", "pulse-ai-portal"))
FIREBASE_SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "666870518780-2b5u95ma67ovhlon6suprpgvjanhnsnr.apps.googleusercontent.com")
HF_TOKEN = os.getenv("HF_TOKEN")
HF_REPO_ID = os.getenv("HF_REPO_ID")
HF_MODEL_FILENAME = os.getenv("HF_MODEL_FILENAME", "model.joblib")
MIN_SAMPLES_TO_TRAIN = int(os.getenv("MIN_SAMPLES_TO_TRAIN", "10"))
LOCAL_EXPORT_PATH = os.path.join(os.path.dirname(__file__), HF_MODEL_FILENAME)


def validate_environment():
    """Verify that required credentials and variables are present."""
    missing = []
    if not FIREBASE_PROJECT_ID and not FIREBASE_SERVICE_ACCOUNT:
        missing.append("FIREBASE_PROJECT_ID / FIREBASE_SERVICE_ACCOUNT")
    if not HF_TOKEN:
        missing.append("HF_TOKEN")
    if not HF_REPO_ID:
        missing.append("HF_REPO_ID")

    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.error("Please configure them in your .env or GitHub Actions secrets.")
        sys.exit(1)


def get_firestore_client() -> firestore.firestore.Client:
    """Connect to Google Firebase Cloud Firestore."""
    try:
        if not firebase_admin._apps:
            cred = None
            if FIREBASE_SERVICE_ACCOUNT:
                if FIREBASE_SERVICE_ACCOUNT.strip().startswith("{"):
                    service_account_info = json.loads(FIREBASE_SERVICE_ACCOUNT)
                    cred = credentials.Certificate(service_account_info)
                    logger.info("Initializing Firebase Admin with inline JSON credentials.")
                elif os.path.exists(FIREBASE_SERVICE_ACCOUNT):
                    cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
                    logger.info(f"Initializing Firebase Admin with certificate file: {FIREBASE_SERVICE_ACCOUNT}")

            if cred:
                firebase_admin.initialize_app(cred, {"projectId": FIREBASE_PROJECT_ID})
            else:
                firebase_admin.initialize_app(options={"projectId": FIREBASE_PROJECT_ID})
                logger.info(f"Initializing Firebase Admin with Project ID: {FIREBASE_PROJECT_ID}")

        return firestore.client()
    except Exception as e:
        logger.error(f"Failed to connect to Firebase Firestore: {e}")
        sys.exit(1)


def fetch_training_dataset(db: firestore.firestore.Client) -> Tuple[pd.DataFrame, List[str]]:
    """
    Fetches all labeled telemetry records from Firebase Firestore collection 'telemetry_logs'.
    Returns parsed DataFrame and list of Firestore document IDs.
    """
    logger.info("Fetching labeled telemetry documents from Firebase Firestore...")
    try:
        docs = db.collection("telemetry_logs").stream()

        parsed_rows = []
        doc_ids = []
        for doc in docs:
            data = doc.to_dict()
            true_label = data.get("true_label")
            if true_label is None:
                continue

            features = data.get("features")
            if isinstance(features, str):
                try:
                    features = json.loads(features)
                except Exception:
                    continue

            if isinstance(features, dict):
                feature_values = [float(v) for v in features.values()]
            elif isinstance(features, list):
                feature_values = [float(v) for v in features]
            else:
                continue

            try:
                label = int(true_label)
            except (ValueError, TypeError):
                continue

            parsed_rows.append({"features": feature_values, "label": label})
            doc_ids.append(doc.id)

        logger.info(f"Total labeled telemetry records retrieved: {len(parsed_rows)}")

        if len(parsed_rows) < MIN_SAMPLES_TO_TRAIN:
            logger.warning(
                f"Insufficient labeled data for retraining. Found {len(parsed_rows)} samples, "
                f"minimum required: {MIN_SAMPLES_TO_TRAIN}. Exiting pipeline gracefully."
            )
            sys.exit(0)

        df = pd.DataFrame(parsed_rows)
        return df, doc_ids

    except Exception as e:
        logger.error(f"Error fetching data from Firestore: {e}")
        sys.exit(1)


def get_previous_model_accuracy(db: firestore.firestore.Client) -> float:
    """Retrieves the accuracy of the currently active model from Firestore 'model_registry'."""
    try:
        docs = (
            db.collection("model_registry")
            .where("is_active", "==", True)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(1)
            .stream()
        )
        for doc in docs:
            data = doc.to_dict()
            if data.get("accuracy") is not None:
                baseline = float(data["accuracy"])
                logger.info(f"Active baseline model accuracy in Firestore: {baseline:.4f}")
                return baseline
    except Exception as e:
        logger.warning(f"Could not retrieve previous model accuracy: {e}")

    logger.info("No active baseline accuracy found. Bootstrapping initial candidate model.")
    return 0.0


def train_candidate_model(df: pd.DataFrame) -> Tuple[Any, float, float, Dict[str, Any]]:
    """
    Trains a Scikit-Learn RandomForestClassifier on the telemetry dataset.
    Returns the trained model, validation accuracy, F1 score, and metadata.
    """
    X = np.array(df["features"].tolist())
    y = np.array(df["label"].tolist())

    unique_classes, counts = np.unique(y, return_counts=True)
    logger.info(f"Dataset classes distribution: {dict(zip(unique_classes.tolist(), counts.tolist()))}")

    if len(unique_classes) < 2:
        logger.warning("Dataset contains only 1 unique class. Cannot train a classifier yet.")
        sys.exit(0)

    # Train / Validation Split
    can_stratify = all(c >= 2 for c in counts)
    X_train, X_val, y_train, y_val = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y if can_stratify else None
    )

    logger.info(f"Training RandomForest on {len(X_train)} samples, validating on {len(X_val)} samples...")

    candidate = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        n_jobs=-1
    )
    candidate.fit(X_train, y_train)

    val_preds = candidate.predict(X_val)
    val_acc = float(accuracy_score(y_val, val_preds))
    val_f1 = float(f1_score(y_val, val_preds, average="weighted", zero_division=0))

    logger.info(f"Candidate Model Validation Accuracy: {val_acc:.4f} | F1: {val_f1:.4f}")
    return candidate, val_acc, val_f1, {"n_train": len(X_train), "n_val": len(X_val)}


def push_model_to_huggingface(
    model: Any,
    version_str: str,
    accuracy: float,
    metrics_meta: Dict[str, Any]
) -> str:
    """
    Serializes model binary and uploads to Hugging Face Hub using HF API.
    Returns the repository commit hash.
    """
    logger.info(f"Authenticating with Hugging Face Hub to upload model to {HF_REPO_ID}...")
    api = HfApi(token=HF_TOKEN)

    # Ensure repository exists
    try:
        api.create_repo(repo_id=HF_REPO_ID, repo_type="model", exist_ok=True)
    except Exception as e:
        logger.warning(f"Note on create_repo: {e}")

    # Serialize model locally
    joblib.dump(model, LOCAL_EXPORT_PATH)
    logger.info(f"Serialized model binary locally to {LOCAL_EXPORT_PATH}")

    # Generate Model Card README
    model_card_content = f"""---
language: en
tags:
- continuous-learning
- edge-ml
- scikit-learn
- firebase-storage
- automated-retraining
metrics:
- accuracy: {accuracy:.4f}
---

# Continuous Learning Edge Model — {version_str}

- **Database**: Google Firebase Cloud Firestore (`{FIREBASE_PROJECT_ID}`)
- **Retrained At**: {datetime.now(timezone.utc).isoformat()}
- **Validation Accuracy**: {accuracy:.4f}
- **Training Samples**: {metrics_meta.get('n_train', 0)}
- **Validation Samples**: {metrics_meta.get('n_val', 0)}
- **Orchestration**: GitHub Actions Weekly Continuous Pipeline
- **Model Storage**: Hugging Face Hub
"""

    card_path = os.path.join(os.path.dirname(__file__), "README.md")
    with open(card_path, "w", encoding="utf-8") as f:
        f.write(model_card_content)

    # Upload model binary
    commit_info = api.upload_file(
        path_or_fileobj=LOCAL_EXPORT_PATH,
        path_in_repo=HF_MODEL_FILENAME,
        repo_id=HF_REPO_ID,
        repo_type="model",
        commit_message=f"Continuous retrain: {version_str} (acc: {accuracy:.4f})"
    )

    # Upload updated model card
    try:
        api.upload_file(
            path_or_fileobj=card_path,
            path_in_repo="README.md",
            repo_id=HF_REPO_ID,
            repo_type="model",
            commit_message=f"Update model card for {version_str}"
        )
    except Exception as e:
        logger.warning(f"Could not upload model card: {e}")

    commit_hash = getattr(commit_info, "commit_id", None) or getattr(commit_info, "oid", version_str)
    logger.info(f"Successfully uploaded model binary to Hugging Face Hub! Commit: {commit_hash}")
    return commit_hash


def update_firestore_registry(
    db: firestore.firestore.Client,
    version_str: str,
    commit_hash: str,
    accuracy: float,
    processed_doc_ids: List[str]
):
    """
    Registers the promoted model in Firestore 'model_registry' and marks processed telemetry documents.
    """
    logger.info("Updating Firebase Firestore 'model_registry' collection...")
    try:
        # Mark previous active models as inactive
        active_docs = db.collection("model_registry").where("is_active", "==", True).stream()
        for doc in active_docs:
            doc.reference.update({"is_active": False})

        # Insert new active model
        db.collection("model_registry").add({
            "version": version_str,
            "commit_hash": commit_hash,
            "repo_id": HF_REPO_ID,
            "filename": HF_MODEL_FILENAME,
            "accuracy": accuracy,
            "is_active": True,
            "google_client_id": GOOGLE_CLIENT_ID,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        # Mark consumed telemetry logs as processed in batches
        if processed_doc_ids:
            batch = db.batch()
            batch_count = 0
            for doc_id in processed_doc_ids:
                doc_ref = db.collection("telemetry_logs").document(doc_id)
                batch.update(doc_ref, {"processed": True})
                batch_count += 1
                if batch_count >= 400:  # Firestore limit is 500 per batch
                    batch.commit()
                    batch = db.batch()
                    batch_count = 0
            if batch_count > 0:
                batch.commit()

        logger.info(f"Firestore model_registry updated and {len(processed_doc_ids)} telemetry logs marked processed.")
    except Exception as e:
        logger.error(f"Failed to record model registry in Firestore: {e}")


def main():
    logger.info("=== Starting Continuous ML Automated Retraining Pipeline (Firebase) ===")
    validate_environment()

    db = get_firestore_client()
    df, doc_ids = fetch_training_dataset(db)
    baseline_acc = get_previous_model_accuracy(db)

    candidate_model, val_acc, val_f1, meta = train_candidate_model(df)

    # Performance Gate Check
    is_improvement = val_acc >= baseline_acc or baseline_acc == 0.0

    if not is_improvement:
        logger.warning(
            f"Candidate model accuracy ({val_acc:.4f}) did NOT improve over active baseline ({baseline_acc:.4f}). "
            f"Rejecting candidate to protect production devices from regression."
        )
        sys.exit(0)

    logger.info(f"Candidate model PROMOTED! (Accuracy: {val_acc:.4f} >= Baseline: {baseline_acc:.4f})")

    # Generate version string
    version_tag = f"v{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

    # Push to Hugging Face Hub
    commit_hash = push_model_to_huggingface(candidate_model, version_tag, val_acc, meta)

    # Record in Firebase Firestore
    update_firestore_registry(db, version_tag, commit_hash, val_acc, doc_ids)

    logger.info("=== Continuous Retraining Pipeline Completed Successfully ===")


if __name__ == "__main__":
    main()
