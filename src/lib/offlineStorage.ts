import { devLog, devError } from '@/utils/logger';

const DB_NAME = 'fynance-offline-db';
const DB_VERSION = 2; // Increment version to add new store

interface PendingOperation {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
}

export interface PendingAIMessage {
  id: string;
  message: string;
  audioBlob?: string; // Base64 encoded audio
  timestamp: number;
  status: 'pending' | 'sending' | 'failed';
  retryCount: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        devError('OfflineStorage: Failed to open IndexedDB', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        devLog('OfflineStorage: IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for cached data per table
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }

        // Store for pending operations (sync queue)
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const store = db.createObjectStore('pendingOperations', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for pending AI messages (offline chat)
        if (!db.objectStoreNames.contains('pendingAIMessages')) {
          const store = db.createObjectStore('pendingAIMessages', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        devLog('OfflineStorage: Database upgraded');
      };
    });

    return this.initPromise;
  }

  // Cache Management
  async cacheData(table: string, userId: string, data: any[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const key = `${table}-${userId}`;

      const request = store.put({ 
        key, 
        data, 
        timestamp: Date.now(),
        table,
        userId
      });

      request.onsuccess = () => {
        devLog(`OfflineStorage: Cached ${data.length} items for ${table}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData(table: string, userId: string): Promise<any[] | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const key = `${table}-${userId}`;

      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          devLog(`OfflineStorage: Retrieved ${result.data.length} cached items for ${table}`);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Pending Operations Management
  async addPendingOperation(operation: PendingOperation): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');

      const request = store.put(operation);

      request.onsuccess = () => {
        devLog(`OfflineStorage: Added pending ${operation.operation} for ${operation.table}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingOperations'], 'readonly');
      const store = transaction.objectStore('pendingOperations');
      const index = store.index('timestamp');

      const request = index.getAll();

      request.onsuccess = () => {
        const operations = request.result || [];
        devLog(`OfflineStorage: Retrieved ${operations.length} pending operations`);
        resolve(operations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingOperation(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');

      const request = store.delete(id);

      request.onsuccess = () => {
        devLog(`OfflineStorage: Removed pending operation ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingOperations(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');

      const request = store.clear();

      request.onsuccess = () => {
        devLog('OfflineStorage: Cleared all pending operations');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingCount(): Promise<number> {
    const operations = await this.getPendingOperations();
    return operations.length;
  }

  // Update cached data with local changes (for optimistic updates)
  async updateCachedItem(table: string, userId: string, itemId: string, updateData: any): Promise<void> {
    const cachedData = await this.getCachedData(table, userId);
    if (!cachedData) return;

    const updatedData = cachedData.map(item => 
      item.id === itemId ? { ...item, ...updateData } : item
    );

    await this.cacheData(table, userId, updatedData);
  }

  async addCachedItem(table: string, userId: string, newItem: any): Promise<void> {
    const cachedData = await this.getCachedData(table, userId) || [];
    
    // Avoid duplicates
    const exists = cachedData.some(item => item.id === newItem.id);
    if (!exists) {
      await this.cacheData(table, userId, [...cachedData, newItem]);
    }
  }

  async removeCachedItem(table: string, userId: string, itemId: string): Promise<void> {
    const cachedData = await this.getCachedData(table, userId);
    if (!cachedData) return;

    const filteredData = cachedData.filter(item => item.id !== itemId);
    await this.cacheData(table, userId, filteredData);
  }

  // Pending AI Messages Management
  async addPendingAIMessage(msg: PendingAIMessage): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingAIMessages'], 'readwrite');
      const store = transaction.objectStore('pendingAIMessages');

      const request = store.put(msg);

      request.onsuccess = () => {
        devLog(`OfflineStorage: Added pending AI message ${msg.id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingAIMessages(): Promise<PendingAIMessage[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingAIMessages'], 'readonly');
      const store = transaction.objectStore('pendingAIMessages');
      const index = store.index('timestamp');

      const request = index.getAll();

      request.onsuccess = () => {
        const messages = request.result || [];
        devLog(`OfflineStorage: Retrieved ${messages.length} pending AI messages`);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updatePendingAIMessage(id: string, updates: Partial<PendingAIMessage>): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingAIMessages'], 'readwrite');
      const store = transaction.objectStore('pendingAIMessages');

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          resolve();
          return;
        }

        const updated = { ...existing, ...updates };
        const putRequest = store.put(updated);

        putRequest.onsuccess = () => {
          devLog(`OfflineStorage: Updated pending AI message ${id}`);
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removePendingAIMessage(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingAIMessages'], 'readwrite');
      const store = transaction.objectStore('pendingAIMessages');

      const request = store.delete(id);

      request.onsuccess = () => {
        devLog(`OfflineStorage: Removed pending AI message ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingAIMessagesCount(): Promise<number> {
    const messages = await this.getPendingAIMessages();
    return messages.length;
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

export type { PendingOperation };
