import os
import json
import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, status, Body, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore, auth

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("continuous_ml_backend")

# Read environment variables
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", os.getenv("VITE_FIREBASE_PROJECT_ID", "pulse-ai-portal"))
FIREBASE_SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "666870518780-2b5u95ma67ovhlon6suprpgvjanhnsnr.apps.googleusercontent.com")
HF_REPO_ID = os.getenv("HF_REPO_ID", "username/continuous-edge-model")
HF_MODEL_FILENAME = os.getenv("HF_MODEL_FILENAME", "model.joblib")

# Initialize Firebase Admin SDK & Cloud Firestore
db = None
try:
    if not firebase_admin._apps:
        cred = None
        if FIREBASE_SERVICE_ACCOUNT:
            # Check if it's a JSON string or a file path
            if FIREBASE_SERVICE_ACCOUNT.strip().startswith("{"):
                service_account_info = json.loads(FIREBASE_SERVICE_ACCOUNT)
                cred = credentials.Certificate(service_account_info)
                logger.info("Initializing Firebase Admin with inline JSON credentials.")
            elif os.path.exists(FIREBASE_SERVICE_ACCOUNT):
                cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
                logger.info(f"Initializing Firebase Admin with certificate file: {FIREBASE_SERVICE_ACCOUNT}")
            else:
                logger.warning("FIREBASE_SERVICE_ACCOUNT path not found, using project ID fallback.")

        if cred:
            firebase_admin.initialize_app(cred, {"projectId": FIREBASE_PROJECT_ID})
        else:
            # Default / Project ID initialization (works on GCP, Render with ADC, or local development)
            firebase_admin.initialize_app(options={"projectId": FIREBASE_PROJECT_ID})
            logger.info(f"Initializing Firebase Admin with Project ID: {FIREBASE_PROJECT_ID}")

    db = firestore.client()
    logger.info("Successfully connected to Firebase Cloud Firestore.")
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin / Firestore: {e}")
    db = None

# FastAPI app definition
app = FastAPI(
    title="Continuous Learning Edge ML Backend (Firebase Firestore)",
    description="Free-tier edge telemetry ingestion and model orchestration powered by Google Firebase.",
    version="2.0.0"
)

# Enable CORS for distributed edge & client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic Data Schemas ---
class TelemetryItem(BaseModel):
    device_id: str = Field(..., description="Unique identifier for the edge/client device")
    features: Union[List[float], Dict[str, Any]] = Field(..., description="Inference feature vector or key-value attributes")
    true_label: Optional[Union[int, float, str]] = Field(None, description="Ground truth label collected on device")
    predicted_label: Optional[Union[int, float, str]] = Field(None, description="Local prediction made by edge model")
    model_version: Optional[str] = Field("initial", description="Version of the model running on device during inference")
    created_at: Optional[str] = Field(None, description="ISO timestamp from device or will default to UTC now")


class ModelVersionResponse(BaseModel):
    version: str
    commit_hash: Optional[str] = None
    repo_id: str
    filename: str
    accuracy: Optional[float] = None
    download_url: str
    updated_at: Optional[str] = None


# --- Endpoints ---

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Continuous Learning ML Backend",
        "database": "Google Firebase Firestore",
        "firebase_project_id": FIREBASE_PROJECT_ID,
        "google_client_id": GOOGLE_CLIENT_ID,
        "firestore_connected": db is not None,
        "repo_id": HF_REPO_ID
    }


@app.get("/health")
def health_check():
    if not db:
        raise HTTPException(status_code=503, detail="Firebase Firestore client uninitialized")
    return {
        "status": "healthy",
        "database": "Firebase Firestore",
        "project_id": FIREBASE_PROJECT_ID,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/log_data", status_code=status.HTTP_201_CREATED)
def log_data(
    payload: Union[TelemetryItem, List[TelemetryItem]] = Body(...),
    authorization: Optional[str] = Header(None)
):
    """
    Ingest telemetry and ground truth labels from distributed edge devices into Firebase Firestore.
    Supports single records or batch payloads for offline synchronization.
    """
    if not db:
        logger.error("Firestore client is uninitialized.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Firestore service unavailable. Verify FIREBASE_PROJECT_ID or credentials."
        )

    # Normalize single item vs batch
    items = payload if isinstance(payload, list) else [payload]
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty telemetry payload received.")

    current_utc = datetime.now(timezone.utc).isoformat()

    try:
        # Use Firestore Batched Writes (up to 500 operations per batch)
        batch = db.batch()
        collection_ref = db.collection("telemetry_logs")

        inserted_count = 0
        for item in items:
            doc_ref = collection_ref.document()  # Auto-generate unique Firestore Document ID
            record = {
                "device_id": item.device_id,
                "features": item.features,
                "true_label": item.true_label,
                "predicted_label": item.predicted_label,
                "model_version": item.model_version,
                "created_at": item.created_at or current_utc,
                "processed": False
            }
            batch.set(doc_ref, record)
            inserted_count += 1

        batch.commit()
        logger.info(f"Successfully logged {inserted_count} record(s) to Firebase Firestore collection 'telemetry_logs'.")
        return {
            "status": "success",
            "inserted_count": inserted_count,
            "database": "Firebase Firestore",
            "timestamp": current_utc
        }
    except Exception as e:
        logger.error(f"Error inserting telemetry logs to Firestore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record telemetry data: {str(e)}"
        )


@app.get("/model_version", response_model=ModelVersionResponse)
def get_model_version():
    """
    Returns the latest active model tracking metadata from Firebase Firestore 'model_registry'
    so edge devices know if an updated model binary should be pulled from Hugging Face Hub.
    """
    download_url_template = f"https://huggingface.co/{HF_REPO_ID}/resolve/main/{HF_MODEL_FILENAME}"

    if db:
        try:
            # Query Firestore collection 'model_registry' for the latest active model
            docs = (
                db.collection("model_registry")
                .where("is_active", "==", True)
                .order_by("created_at", direction=firestore.Query.DESCENDING)
                .limit(1)
                .stream()
            )
            for doc in docs:
                latest = doc.to_dict()
                repo = latest.get("repo_id") or HF_REPO_ID
                filename = latest.get("filename") or HF_MODEL_FILENAME
                return ModelVersionResponse(
                    version=latest.get("version", "v1.0.0"),
                    commit_hash=latest.get("commit_hash"),
                    repo_id=repo,
                    filename=filename,
                    accuracy=latest.get("accuracy"),
                    download_url=f"https://huggingface.co/{repo}/resolve/main/{filename}",
                    updated_at=latest.get("created_at")
                )
        except Exception as e:
            logger.warning(f"Could not read from Firestore model_registry: {e}. Returning fallback metadata.")

    # Fallback default response when registry is bootstrapping
    return ModelVersionResponse(
        version="v1.0.0-bootstrap",
        commit_hash="bootstrap",
        repo_id=HF_REPO_ID,
        filename=HF_MODEL_FILENAME,
        accuracy=None,
        download_url=download_url_template,
        updated_at=datetime.now(timezone.utc).isoformat()
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
