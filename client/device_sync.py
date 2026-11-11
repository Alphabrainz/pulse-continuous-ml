import os
import json
import sqlite3
import logging
import tempfile
import shutil
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timezone

import requests
import joblib
import numpy as np

# Configure logging for device client
logging.basicConfig(level=logging.INFO, format="%(asctime)s [DEVICE-%(levelname)s] %(message)s")
logger = logging.getLogger("device_sync")

# Default configurations
DEFAULT_BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
DEFAULT_DEVICE_ID = os.getenv("DEVICE_ID", f"edge_node_{os.getpid()}")
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "local_model.joblib")
DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "device_cache.db")


class DeviceSyncManager:
    """
    Manages local edge inference, offline SQLite caching,
    backend telemetry synchronization, and OTA model updates.
    """

    def __init__(
        self,
        backend_url: str = DEFAULT_BACKEND_URL,
        device_id: str = DEFAULT_DEVICE_ID,
        model_path: str = DEFAULT_MODEL_PATH,
        db_path: str = DEFAULT_DB_PATH,
    ):
        self.backend_url = backend_url.rstrip("/")
        self.device_id = device_id
        self.model_path = model_path
        self.db_path = db_path
        self._loaded_model = None

        self._init_sqlite()
        self._load_local_model()

    def _init_sqlite(self):
        """Initializes local SQLite schema for offline buffering and metadata."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS offline_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        device_id TEXT NOT NULL,
                        features_json TEXT NOT NULL,
                        true_label TEXT,
                        predicted_label TEXT,
                        model_version TEXT,
                        created_at TEXT NOT NULL,
                        synced INTEGER DEFAULT 0
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS metadata (
                        key TEXT PRIMARY KEY,
                        value TEXT NOT NULL
                    );
                """)
                conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Failed to initialize local SQLite cache: {e}")

    def _get_metadata(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Fetch a value from local metadata table."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM metadata WHERE key = ?", (key,))
                row = cursor.fetchone()
                return row[0] if row else default
        except sqlite3.Error:
            return default

    def _set_metadata(self, key: str, value: str):
        """Save a key-value pair in local metadata table."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO metadata (key, value) VALUES (?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value;
                """, (key, value))
                conn.commit()
        except sqlite3.Error as e:
            logger.warning(f"Could not persist metadata {key}: {e}")

    def _load_local_model(self):
        """Loads model binary from local disk into memory if present."""
        if os.path.exists(self.model_path):
            try:
                self._loaded_model = joblib.load(self.model_path)
                logger.info(f"Loaded local model from {self.model_path}")
            except Exception as e:
                logger.warning(f"Could not deserialize local model ({e}). Will run fallback inference.")
                self._loaded_model = None
        else:
            logger.info("No local model binary found on disk yet. Running in bootstrap/heuristic mode.")
            self._loaded_model = None

    def get_current_model_version(self) -> str:
        """Returns the local model version or commit hash."""
        return self._get_metadata("model_version", "v0.0.0-initial")

    def predict_and_cache(
        self,
        features: Union[List[float], Dict[str, Any]],
        true_label: Optional[Union[int, float, str]] = None
    ) -> Any:
        """
        Executes local model inference, then writes the input features,
        local prediction, and optional true label into the local SQLite cache.
        """
        model_version = self.get_current_model_version()
        predicted_label = None

        # 1. Run inference using local model
        try:
            if self._loaded_model is not None:
                # Prepare input shape
                if isinstance(features, list):
                    arr = np.array(features).reshape(1, -1)
                elif isinstance(features, dict):
                    arr = np.array(list(features.values())).reshape(1, -1)
                else:
                    arr = np.array(features).reshape(1, -1)

                raw_pred = self._loaded_model.predict(arr)
                predicted_label = int(raw_pred[0]) if hasattr(raw_pred[0], "item") else raw_pred[0]
            else:
                # Fallback / Simulated prediction when bootstrap model is not downloaded yet
                if isinstance(features, list) and len(features) > 0:
                    predicted_label = int(sum(features) > 0)
                else:
                    predicted_label = 0
                logger.debug("Used heuristic inference (no active model binary).")
        except Exception as e:
            logger.warning(f"Inference error with local model: {e}. Using fallback 0.")
            predicted_label = 0

        # 2. Buffer to local SQLite for offline persistence
        created_at = datetime.now(timezone.utc).isoformat()
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO offline_logs (
                        device_id, features_json, true_label, predicted_label, model_version, created_at, synced
                    ) VALUES (?, ?, ?, ?, ?, ?, 0);
                """, (
                    self.device_id,
                    json.dumps(features),
                    str(true_label) if true_label is not None else None,
                    str(predicted_label) if predicted_label is not None else None,
                    model_version,
                    created_at
                ))
                conn.commit()
            logger.debug(f"Cached inference log to SQLite: pred={predicted_label}, label={true_label}")
        except sqlite3.Error as e:
            logger.error(f"Failed to buffer log to SQLite: {e}")

        return predicted_label

    def sync_to_cloud(self, batch_size: int = 50) -> Dict[str, Any]:
        """
        Reads buffered logs from local SQLite, pushes them via POST /log_data
        to the FastAPI backend, and deletes or marks synced rows upon success.
        Gracefully handles network dropouts, offline states, and timeouts.
        """
        unsynced_rows = []
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, device_id, features_json, true_label, predicted_label, model_version, created_at
                    FROM offline_logs
                    WHERE synced = 0
                    ORDER BY id ASC
                    LIMIT ?;
                """, (batch_size,))
                unsynced_rows = cursor.fetchall()
        except sqlite3.Error as e:
            logger.error(f"Error reading SQLite buffer: {e}")
            return {"synced": 0, "status": "error", "detail": str(e)}

        if not unsynced_rows:
            logger.info("Local offline buffer is empty. Nothing to sync.")
            return {"synced": 0, "status": "idle"}

        # Prepare payload for backend
        payload = []
        row_ids = []
        for row in unsynced_rows:
            r_id, dev_id, feat_json, t_lbl, p_lbl, m_ver, c_at = row
            row_ids.append(r_id)
            payload.append({
                "device_id": dev_id,
                "features": json.loads(feat_json),
                "true_label": t_lbl,
                "predicted_label": p_lbl,
                "model_version": m_ver,
                "created_at": c_at
            })

        endpoint = f"{self.backend_url}/log_data"
        logger.info(f"Attempting to sync {len(payload)} log(s) to cloud at {endpoint}...")

        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=8.0  # Safe timeout for edge networks
            )
            response.raise_for_status()

            # Upon successful sync, purge synced logs from SQLite to conserve disk space
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                placeholders = ",".join("?" for _ in row_ids)
                cursor.execute(f"DELETE FROM offline_logs WHERE id IN ({placeholders});", row_ids)
                conn.commit()

            logger.info(f"Successfully synced and purged {len(row_ids)} record(s) to cloud.")
            return {"synced": len(row_ids), "status": "success"}

        except requests.exceptions.RequestException as e:
            # Network dropout / backend offline: Logs remain preserved in SQLite!
            logger.warning(
                f"Network dropout during sync ({e.__class__.__name__}: {e}). "
                f"Retaining {len(row_ids)} record(s) safely in local SQLite buffer."
            )
            return {"synced": 0, "status": "offline_buffered", "detail": str(e)}

    def check_for_updates(self) -> bool:
        """
        Queries backend GET /model_version. If a newer model exists (different commit_hash or version),
        downloads the binary from Hugging Face Hub, atomically replaces local model, and reloads.
        """
        endpoint = f"{self.backend_url}/model_version"
        logger.info(f"Checking for model updates at {endpoint}...")

        try:
            resp = requests.get(endpoint, timeout=8.0)
            resp.raise_for_status()
            data = resp.json()
        except requests.exceptions.RequestException as e:
            logger.warning(f"Unable to reach model version endpoint ({e}). Retaining current model.")
            return False

        remote_version = data.get("version")
        remote_commit = data.get("commit_hash")
        download_url = data.get("download_url")

        local_version = self._get_metadata("model_version", "")
        local_commit = self._get_metadata("model_commit", "")

        # Check if update is needed
        needs_update = False
        if remote_commit and remote_commit != "bootstrap" and remote_commit != local_commit:
            needs_update = True
        elif remote_version and remote_version != "v0.0.0-initial" and remote_version != local_version:
            needs_update = True

        if not needs_update:
            logger.info(f"Local model is up to date (Version: {local_version or remote_version}).")
            return False

        logger.info(f"New model detected! Remote: {remote_version} ({remote_commit}) vs Local: {local_version}. Downloading...")

        if not download_url:
            logger.error("No download_url provided in model version response.")
            return False

        # Download safely via streaming to temporary file
        try:
            with requests.get(download_url, stream=True, timeout=30.0) as r:
                r.raise_for_status()
                with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            tmp_file.write(chunk)
                    tmp_file_path = tmp_file.name

            # Verify downloaded binary can be loaded before replacing
            try:
                candidate_model = joblib.load(tmp_file_path)
                # Atomically move to target path
                shutil.move(tmp_file_path, self.model_path)
                self._loaded_model = candidate_model

                # Update metadata in local SQLite
                self._set_metadata("model_version", remote_version or "unknown")
                if remote_commit:
                    self._set_metadata("model_commit", remote_commit)

                logger.info(f"Successfully updated model to {remote_version} on local device!")
                return True
            except Exception as e:
                logger.error(f"Downloaded model corrupted or invalid ({e}). Aborting swap.")
                if os.path.exists(tmp_file_path):
                    os.remove(tmp_file_path)
                return False

        except requests.exceptions.RequestException as e:
            logger.warning(f"Failed to download model update: {e}. Will retry on next sync interval.")
            return False


# --- Convenience Top-Level Functions ---
_global_client: Optional[DeviceSyncManager] = None

def get_client() -> DeviceSyncManager:
    global _global_client
    if _global_client is None:
        _global_client = DeviceSyncManager()
    return _global_client

def predict_and_cache(features: Union[List[float], Dict[str, Any]], true_label: Optional[Union[int, float, str]] = None) -> Any:
    """Module-level function: Runs local inference and caches to SQLite."""
    return get_client().predict_and_cache(features, true_label)

def sync_to_cloud(batch_size: int = 50) -> Dict[str, Any]:
    """Module-level function: Pushes buffered logs to cloud."""
    return get_client().sync_to_cloud(batch_size)

def check_for_updates() -> bool:
    """Module-level function: Checks and downloads newer models from Hugging Face."""
    return get_client().check_for_updates()


if __name__ == "__main__":
    print("\n--- Edge Device Continuous Learning Client Simulation ---")
    client = DeviceSyncManager()

    # 1. Simulate streaming telemetry events
    print("\n1. Generating local predictions with offline buffering...")
    for i in range(5):
        sample_features = [float(np.random.normal(loc=0.5, scale=1.0)) for _ in range(4)]
        simulated_ground_truth = int(sample_features[0] + sample_features[1] > 1.0)
        
        pred = client.predict_and_cache(sample_features, true_label=simulated_ground_truth)
        print(f"  Event #{i+1}: Features={sample_features[:2]}... -> Pred={pred}, True={simulated_ground_truth}")

    # 2. Check for updates
    print("\n2. Checking for model updates from backend...")
    updated = client.check_for_updates()
    print(f"  Model update status: {updated}")

    # 3. Synchronize to cloud
    print("\n3. Synchronizing offline buffer with backend...")
    sync_result = client.sync_to_cloud()
    print(f"  Sync result: {sync_result}")

