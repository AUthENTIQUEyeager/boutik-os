import { api } from './api';
import { getQueue, clearQueueItems } from './db';
import { pullDifferentiel } from './pull';
import { SYNC_INTERVAL_MS } from './constants';

class SyncService {
  constructor() {
    this.token = null;
    this.intervalId = null;
    this.syncing = false;
    this.listeners = new Set();
    this.status = 'idle'; // idle | syncing | error | offline
  }

  setToken(token) {
    this.token = token;
    if (token) this.start();
    else this.stop();
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.runSync(), SYNC_INTERVAL_MS);
    this.runSync();
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  onStatusChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  setStatus(status) {
    this.status = status;
    this.listeners.forEach((cb) => cb(status));
  }

  async runSync() {
    if (this.syncing) return;
    if (!this.token || !navigator.onLine) {
      this.setStatus('offline');
      return;
    }
    this.syncing = true;
    try {
      this.setStatus('syncing');

      const queue = await getQueue();
      if (queue.length) {
        const { results } = await api.syncPush(queue);
        const successIds = results.filter((r) => r.success).map((r) => r.id);
        if (successIds.length) await clearQueueItems(successIds);
      }

      await pullDifferentiel();

      this.setStatus('idle');
    } catch (err) {
      console.error('Erreur de synchronisation:', err);
      this.setStatus('error');
    } finally {
      this.syncing = false;
    }
  }

  async syncNow() {
    return this.runSync();
  }
}

export const syncService = new SyncService();
