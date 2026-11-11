import os
import time
import random
import logging
from client.device_sync import DeviceSyncManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [FLEET-%(levelname)s] %(message)s")
logger = logging.getLogger("simulate_fleet")

def simulate_fleet(num_devices: int = 3, events_per_device: int = 4, backend_url: str = "http://localhost:8000"):
    """
    Simulates a fleet of distributed IoT/edge devices performing local inference,
    experiencing simulated network outages, and recovering via SQLite sync.
    """
    logger.info(f"=== Starting Fleet Simulation: {num_devices} Distributed Devices ===")
    
    devices = []
    for d in range(num_devices):
        dev_id = f"device_sensor_{d+1:02d}"
        db_file = os.path.join(os.path.dirname(__file__), f"cache_{dev_id}.db")
        model_file = os.path.join(os.path.dirname(__file__), f"model_{dev_id}.joblib")
        
        mgr = DeviceSyncManager(
            backend_url=backend_url,
            device_id=dev_id,
            model_path=model_file,
            db_path=db_file
        )
        devices.append(mgr)

    # 1. Edge Devices running inference offline
    logger.info("\n--- Phase 1: Local Inference & Offline SQLite Buffering ---")
    for mgr in devices:
        for step in range(events_per_device):
            # Synthetic 4-dim feature vector
            feats = [round(random.gauss(0, 1), 3) for _ in range(4)]
            simulated_true = 1 if (feats[0] + feats[1] > 0) else 0
            
            pred = mgr.predict_and_cache(feats, true_label=simulated_true)
            logger.info(f"[{mgr.device_id}] Inference event: Input={feats[:2]}... -> Pred={pred}, True={simulated_true}")

    # 2. Simulate network outage
    logger.info("\n--- Phase 2: Simulating Temporary Network Outage ---")
    logger.info("Attempting sync while network is down (simulated bad URL)...")
    for mgr in devices:
        original_url = mgr.backend_url
        mgr.backend_url = "http://invalid-unreachable-edge-gateway:9999"
        result = mgr.sync_to_cloud()
        logger.info(f"[{mgr.device_id}] Outage Result: {result['status']} (Zero data lost; logs preserved in SQLite)")
        mgr.backend_url = original_url  # Restore connectivity

    # 3. Network Restored: Flush offline buffer to backend
    logger.info("\n--- Phase 3: Connectivity Restored — Flushing Local Buffers ---")
    for mgr in devices:
        result = mgr.sync_to_cloud()
        logger.info(f"[{mgr.device_id}] Cloud Sync Status: {result}")

    # 4. Check for Over-The-Air Model Updates
    logger.info("\n--- Phase 4: Checking Over-The-Air (OTA) Model Updates ---")
    for mgr in devices:
        updated = mgr.check_for_updates()
        logger.info(f"[{mgr.device_id}] Model update check completed: {updated}")

    logger.info("\n=== Fleet Simulation Completed Successfully ===")

if __name__ == "__main__":
    simulate_fleet()

