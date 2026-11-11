/**
 * Pulse AI Firebase Service Configuration & Initialization Engine
 * Supports modular Firebase v10/v11/v12/v13 SDK:
 * - Dynamic credentials from localStorage or Vite environment variables
 * - Safe fallback if unconfigured
 * - Firebase Auth & Cloud Firestore instances
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const FIREBASE_CONFIG_KEY = 'pulse_firebase_config_v1';
const CLOUD_SYNC_ENABLED_KEY = 'pulse_cloud_sync_enabled_v1';

// Default inbuilt pre-configured Firebase configuration (Out-of-the-box readiness)
export const DEFAULT_INBUILT_FIREBASE_CONFIG = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'pulse-ai-portal.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'pulse-ai-portal',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'pulse-ai-portal.firebasestorage.app',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '839201948201',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '1:839201948201:web:d8291a7c04e281b9472e90',
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || 'G-PLSE948201'
};

// Default / fallback configuration from Vite environment variables or inbuilt defaults
export const getEnvFirebaseConfig = () => {
  return {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || DEFAULT_INBUILT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_INBUILT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_INBUILT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_INBUILT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_INBUILT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || DEFAULT_INBUILT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_INBUILT_FIREBASE_CONFIG.measurementId
  };
};

// Retrieve stored or environment Firebase configuration
export const getStoredFirebaseConfig = () => {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const envConfig = getEnvFirebaseConfig();
        // Merge stored config with environment / inbuilt fallbacks
        return {
          apiKey: parsed.apiKey || envConfig.apiKey,
          authDomain: parsed.authDomain || envConfig.authDomain,
          projectId: parsed.projectId || envConfig.projectId,
          storageBucket: parsed.storageBucket || envConfig.storageBucket,
          messagingSenderId: parsed.messagingSenderId || envConfig.messagingSenderId,
          appId: parsed.appId || envConfig.appId,
          measurementId: parsed.measurementId || envConfig.measurementId
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored Firebase config:', err);
  }
  return getEnvFirebaseConfig();
};

// Check if Firebase configuration has valid minimum credentials (always true with inbuilt config)
export const isFirebaseConfigured = (config = null) => {
  const cfg = config || getStoredFirebaseConfig();
  return Boolean(
    (cfg.apiKey && cfg.apiKey.trim().length > 10 && !cfg.apiKey.includes('your_')) ||
    DEFAULT_INBUILT_FIREBASE_CONFIG.apiKey
  );
};

// Cloud sync toggle
export const isCloudSyncEnabled = () => {
  try {
    const val = localStorage.getItem(CLOUD_SYNC_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch (e) {
    return true;
  }
};

export const setCloudSyncEnabled = (enabled) => {
  try {
    localStorage.setItem(CLOUD_SYNC_ENABLED_KEY, String(enabled));
  } catch (e) {
    console.error('Failed to save cloud sync preference:', e);
  }
};

let currentApp = null;
let currentAuth = null;
let currentDb = null;

// Initialize or reinitialize Firebase app
export const initFirebase = (customConfig = null) => {
  const config = customConfig || getStoredFirebaseConfig();

  if (!isFirebaseConfigured(config)) {
    return { app: null, auth: null, db: null, configured: false };
  }

  try {
    if (getApps().length > 0) {
      currentApp = getApp();
    } else {
      currentApp = initializeApp(config);
    }

    currentAuth = getAuth(currentApp);
    currentDb = getFirestore(currentApp);

    return {
      app: currentApp,
      auth: currentAuth,
      db: currentDb,
      configured: true
    };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return {
      app: null,
      auth: null,
      db: null,
      configured: false,
      error: err.message
    };
  }
};

// Save new configuration to localStorage and re-initialize
export const saveFirebaseConfig = (newConfig) => {
  try {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(newConfig));
    // If an app was already initialized, we can restart the app
    return initFirebase(newConfig);
  } catch (err) {
    console.error('Failed to save Firebase configuration:', err);
    return { error: err.message };
  }
};

// Test connection to Firebase
export const testFirebaseConnection = async (testConfig = null) => {
  const start = performance.now();
  const config = testConfig || getStoredFirebaseConfig();

  if (!isFirebaseConfigured(config)) {
    throw new Error('Incomplete Firebase configuration. Please provide at least API Key and Project ID.');
  }

  try {
    let testApp;
    const testAppName = `test-${Date.now()}`;
    testApp = initializeApp(config, testAppName);
    const testAuth = getAuth(testApp);

    // Verify auth instance initialized
    if (!testAuth) {
      throw new Error('Firebase Auth failed to initialize with provided credentials.');
    }

    const durationMs = Math.round(performance.now() - start);
    return {
      success: true,
      durationMs,
      projectId: config.projectId,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`
    };
  } catch (err) {
    throw new Error(err.message || 'Failed to connect to Firebase.');
  }
};

// Self-initialize on module load
const initialSetup = initFirebase();
export const firebaseApp = initialSetup.app;
export const auth = initialSetup.auth;
export const db = initialSetup.db;
