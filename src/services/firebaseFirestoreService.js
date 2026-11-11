/**
 * Pulse AI Firebase Cloud Firestore Service
 * Provides real-time synchronization for conversations, bookmarks, and user personalization memory.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, initFirebase, isCloudSyncEnabled } from './firebase';
import { sanitizeConversationsForStorage, saveConversations, getStoredConversations } from '../utils/storage';
import { personalizationService } from './personalizationService';

class FirebaseFirestoreService {
  getDbInstance() {
    if (db) return db;
    const { db: freshDb } = initFirebase();
    return freshDb;
  }

  // Sanitize object for Firestore (removes undefined fields, cleans base64 payloads)
  sanitizeForFirestore(data) {
    if (!data || typeof data !== 'object') return data;

    const clean = JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value === undefined) return null;
        // Avoid Firestore 1MB document size limit from raw image base64
        if (typeof value === 'string' && value.startsWith('data:') && value.length > 50000) {
          return null;
        }
        return value;
      })
    );
    return clean;
  }

  // Save single conversation to Cloud Firestore
  async saveConversation(userId, conversation) {
    if (!userId || !conversation || !conversation.id || !isCloudSyncEnabled()) return;
    const firestore = this.getDbInstance();
    if (!firestore) return;

    try {
      const sanitized = this.sanitizeForFirestore({
        ...conversation,
        updatedAt: conversation.updatedAt || new Date().toISOString(),
        syncedAt: new Date().toISOString()
      });

      const convRef = doc(firestore, 'users', userId, 'conversations', String(conversation.id));
      await setDoc(convRef, sanitized, { merge: true });
    } catch (err) {
      console.warn('Failed to save conversation to Cloud Firestore:', err);
    }
  }

  // Delete conversation from Cloud Firestore
  async deleteConversation(userId, conversationId) {
    if (!userId || !conversationId) return;
    const firestore = this.getDbInstance();
    if (!firestore) return;

    try {
      const convRef = doc(firestore, 'users', userId, 'conversations', String(conversationId));
      await deleteDoc(convRef);
    } catch (err) {
      console.warn('Failed to delete conversation from Cloud Firestore:', err);
    }
  }

  // Fetch all conversations from Cloud Firestore
  async loadConversations(userId) {
    if (!userId) return [];
    const firestore = this.getDbInstance();
    if (!firestore) return [];

    try {
      const convsRef = collection(firestore, 'users', userId, 'conversations');
      const q = query(convsRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);

      const conversations = [];
      snapshot.forEach((d) => {
        conversations.push({ id: d.id, ...d.data() });
      });

      return conversations;
    } catch (err) {
      console.warn('Failed to load conversations from Cloud Firestore:', err);
      // Fallback query without orderBy if index is still propagating
      try {
        const convsRef = collection(firestore, 'users', userId, 'conversations');
        const snapshot = await getDocs(convsRef);
        const conversations = [];
        snapshot.forEach((d) => {
          conversations.push({ id: d.id, ...d.data() });
        });
        return conversations;
      } catch (fallbackErr) {
        return [];
      }
    }
  }

  // Intelligent two-way merge between local storage and Cloud Firestore
  async syncConversations(userId, localConversations = null) {
    if (!userId || !isCloudSyncEnabled()) return localConversations || getStoredConversations();
    const firestore = this.getDbInstance();
    if (!firestore) return localConversations || getStoredConversations();

    const currentLocal = localConversations || getStoredConversations();

    try {
      const cloudConversations = await this.loadConversations(userId);

      const mergedMap = new Map();

      // Index all cloud conversations
      cloudConversations.forEach((c) => {
        mergedMap.set(c.id, c);
      });

      // Merge local conversations
      const toUpload = [];
      currentLocal.forEach((loc) => {
        const cloud = mergedMap.get(loc.id);
        if (!cloud) {
          // Exists locally but not in cloud -> upload to cloud
          mergedMap.set(loc.id, loc);
          toUpload.push(loc);
        } else {
          // Both exist -> keep the one with the newer updatedAt
          const locTime = new Date(loc.updatedAt || 0).getTime();
          const cloudTime = new Date(cloud.updatedAt || 0).getTime();

          if (locTime > cloudTime) {
            mergedMap.set(loc.id, loc);
            toUpload.push(loc);
          }
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });

      // Persist merged set locally
      saveConversations(mergedList);

      // Asynchronously upload local-exclusive or newer threads to cloud
      if (toUpload.length > 0) {
        Promise.all(toUpload.map((c) => this.saveConversation(userId, c))).catch((e) =>
          console.warn('Background sync upload error:', e)
        );
      }

      return mergedList;
    } catch (err) {
      console.warn('Sync failed, using local copy:', err);
      return currentLocal;
    }
  }

  // Batch upload all local conversations to Cloud Firestore
  async uploadAllLocalConversations(userId) {
    if (!userId) throw new Error('User not authenticated.');
    const firestore = this.getDbInstance();
    if (!firestore) throw new Error('Firestore not initialized.');

    const local = getStoredConversations();
    let count = 0;

    for (const conv of local) {
      await this.saveConversation(userId, conv);
      count++;
    }

    return { uploadedCount: count };
  }

  // Real-time snapshot listener for cloud conversations
  subscribeToConversations(userId, onUpdate) {
    if (!userId || !isCloudSyncEnabled()) return () => {};
    const firestore = this.getDbInstance();
    if (!firestore) return () => {};

    try {
      const convsRef = collection(firestore, 'users', userId, 'conversations');
      return onSnapshot(
        convsRef,
        (snapshot) => {
          const cloudConversations = [];
          snapshot.forEach((d) => {
            cloudConversations.push({ id: d.id, ...d.data() });
          });
          onUpdate(cloudConversations);
        },
        (err) => {
          console.warn('Cloud conversation listener error:', err);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Cloud Firestore snapshot listener:', err);
      return () => {};
    }
  }

  // Save user personalization memory to cloud
  async savePersonalization(userId, personalization) {
    if (!userId || !isCloudSyncEnabled()) return;
    const firestore = this.getDbInstance();
    if (!firestore) return;

    try {
      const profileRef = doc(firestore, 'users', userId, 'profile', 'personalization');
      const sanitized = this.sanitizeForFirestore({
        ...personalization,
        updatedAt: new Date().toISOString()
      });
      await setDoc(profileRef, sanitized, { merge: true });
    } catch (err) {
      console.warn('Failed to save personalization to cloud:', err);
    }
  }

  // Load user personalization memory from cloud
  async loadPersonalization(userId) {
    if (!userId) return null;
    const firestore = this.getDbInstance();
    if (!firestore) return null;

    try {
      const profileRef = doc(firestore, 'users', userId, 'profile', 'personalization');
      const snap = await getDocs(collection(firestore, 'users', userId, 'profile'));
      let profile = null;
      snap.forEach((d) => {
        if (d.id === 'personalization') {
          profile = d.data();
        }
      });
      return profile;
    } catch (err) {
      console.warn('Failed to load cloud personalization:', err);
      return null;
    }
  }
}

export const firebaseFirestoreService = new FirebaseFirestoreService();
