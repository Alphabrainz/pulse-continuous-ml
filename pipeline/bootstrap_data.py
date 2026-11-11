import os
import sys
import json
import logging
from datetime import datetime, timezone
import numpy as np
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [BOOTSTRAP-%(levelname)s] %(message)s")
logger = logging.getLogger("bootstrap_data")

load_dotenv()

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", os.getenv("VITE_FIREBASE_PROJECT_ID", "pulse-ai-portal"))
FIREBASE_SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "666870518780-2b5u95ma67ovhlon6suprpgvjanhnsnr.apps.googleusercontent.com")

def bootstrap_dataset(num_samples: int = 60):
    """
    Seeds Firebase Firestore collection 'telemetry_logs' with synthetic labeled feature vectors
    so the retraining pipeline can be executed and tested immediately.
    """
    logger.info(f"Connecting to Firebase Firestore for Project ID: {FIREBASE_PROJECT_ID}...")

    if not firebase_admin._apps:
        cred = None
        if FIREBASE_SERVICE_ACCOUNT:
            if FIREBASE_SERVICE_ACCOUNT.strip().startswith("{"):
                cred = credentials.Certificate(json.loads(FIREBASE_SERVICE_ACCOUNT))
            elif os.path.exists(FIREBASE_SERVICE_ACCOUNT):
                cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)

        if cred:
            firebase_admin.initialize_app(cred, {"projectId": FIREBASE_PROJECT_ID})
        else:
            firebase_admin.initialize_app(options={"projectId": FIREBASE_PROJECT_ID})

    db = firestore.client()
    collection_ref = db.collection("telemetry_logs")

    logger.info(f"Generating {num_samples} synthetic edge telemetry records...")
    batch = db.batch()
    batch_count = 0

    for i in range(num_samples):
        # 4 numerical features
        f1 = float(np.random.normal(loc=1.0 if i % 2 == 0 else -1.0, scale=0.8))
        f2 = float(np.random.normal(loc=0.5 if i % 2 == 0 else -0.5, scale=0.9))
        f3 = float(np.random.uniform(-1.0, 1.0))
        f4 = float(np.random.normal(loc=0.0, scale=0.5))

        # Ground truth label: 1 if (f1 + f2 > 0) else 0
        true_label = int((f1 + f2) > 0.0)

        # Simulated device prediction (e.g. 85% accurate)
        noisy_pred = true_label if np.random.rand() > 0.15 else (1 - true_label)

        doc_ref = collection_ref.document()
        record = {
            "device_id": f"bootstrap_node_{i % 5}",
            "features": [round(f1, 4), round(f2, 4), round(f3, 4), round(f4, 4)],
            "true_label": true_label,
            "predicted_label": noisy_pred,
            "model_version": "v1.0.0-bootstrap",
            "google_client_id": GOOGLE_CLIENT_ID,
            "processed": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        batch.set(doc_ref, record)
        batch_count += 1

        if batch_count >= 400:
            batch.commit()
            batch = db.batch()
            batch_count = 0

    if batch_count > 0:
        batch.commit()

    logger.info(f"Successfully seeded {num_samples} labeled documents into Firestore collection 'telemetry_logs'!")
    logger.info("You can now run 'python pipeline/train.py' or trigger the GitHub Action.")

if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    bootstrap_dataset(count)
