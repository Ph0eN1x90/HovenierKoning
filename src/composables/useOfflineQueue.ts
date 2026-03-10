import { API_BASE_URL } from 'src/config/api';
import type { QueuedRequest } from 'src/models/QueuedRequest';
import type { Tree } from 'src/models/Tree';
import type { Address } from 'src/models/Address';
import { getIndexedDb } from './useIndexedDb';
import { useIndexedDbData } from './useIndexedDbData';
import { useAppNotify } from './useAppNotify';

let queueInitialized = false;

/**
 * Ensure data is cloneable for IndexedDB storage
 */
function sanitizeForIndexedDb<T>(data: T): T {
  try {
    // structuredClone handles most native types but fails on Vue proxies
    return structuredClone(data);
  } catch {
    try {
      // Fallback to JSON-safe clone (drops functions, undefined, symbols)
      return JSON.parse(JSON.stringify(data)) as T;
    } catch {
      return data;
    }
  }
}

/**
 * Add a request to the offline queue
 */
async function addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp'>): Promise<void> {
  const safeData = request.data !== undefined ? sanitizeForIndexedDb(request.data) : undefined;

  const queuedRequest: QueuedRequest = {
    ...request,
    data: safeData,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const db = await getIndexedDb();
  await db.add('queue', queuedRequest);
}

/**
 * Get all pending requests from the queue
 */
async function getQueue(): Promise<QueuedRequest[]> {
  const db = await getIndexedDb();
  const requests = await db.getAll('queue');
  return requests.sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp (FIFO)
}

/**
 * Remove a request from the queue
 */
async function removeFromQueue(id: string): Promise<void> {
  const db = await getIndexedDb();
  await db.delete('queue', id);
}

async function updateQueuedRequestDataByClientId(
  clientId: number,
  updater: (data: unknown) => unknown
): Promise<boolean> {
  const db = await getIndexedDb();
  const requests = await db.getAll('queue');
  const target = requests.find(req => req.clientId === clientId);

  if (!target) return false;

  const updated: QueuedRequest = {
    ...target,
    data: sanitizeForIndexedDb(updater(target.data)),
  };

  await db.put('queue', updated);
  return true;
}

async function removeQueuedRequestByClientId(clientId: number): Promise<boolean> {
  const db = await getIndexedDb();
  const requests = await db.getAll('queue');
  const target = requests.find(req => req.clientId === clientId);

  if (!target) return false;

  await db.delete('queue', target.id);
  return true;
}

/**
 * Clear all pending requests (used after successful sync)
 */
async function clearQueue(): Promise<void> {
  const db = await getIndexedDb();
  await db.clear('queue');
}

/**
 * Get the count of pending requests
 */
async function getQueueCount(): Promise<number> {
  const db = await getIndexedDb();
  return await db.count('queue');
}

/**
 * Process all pending requests when connection is restored
 */
async function processPendingRequests(): Promise<void> {
  const notifier = useAppNotify();

  if (!navigator.onLine) {
    return;
  }

  const queue = await getQueue();
  if (queue.length === 0) {
    return;
  }

  const successfulRequests: string[] = [];
  const failedRequests: { request: QueuedRequest; error: string }[] = [];

  // Process requests sequentially to maintain order
  const {
    upsertTree,
    replaceTreeId,
    deleteTreeById,
    recalculateAddressCompletion,
    saveAddresses,
  } = useIndexedDbData();

  const mergeTreeImages = (tree: Tree, queuedTree: Tree | null): Tree => {
    if (!queuedTree?.treeimage?.length) return tree;
    if (tree.treeimage && tree.treeimage.length > 0) return tree;
    return {
      ...tree,
      treeimage: queuedTree.treeimage,
    };
  };

  for (const queuedRequest of queue) {
    try {
      const fetchOptions: RequestInit = {
        method: queuedRequest.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Only add body if data exists
      if (queuedRequest.data) {
        fetchOptions.body = JSON.stringify(queuedRequest.data);
      }

      const response = await fetch(new URL(queuedRequest.url, API_BASE_URL).toString(), fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let responseData: unknown = null;

      if (contentType.includes('application/json')) {
        try {
          responseData = await response.clone().json();
        } catch {
          responseData = null;
        }
      }

      // Update local IndexedDB dataset based on server response
      if (queuedRequest.url.includes('/api/trees')) {
        if (queuedRequest.method === 'POST' || queuedRequest.method === 'PUT') {
          const tree = responseData as Tree | null;
          if (tree) {
            const queuedTree = queuedRequest.data as Tree | null;
            const mergedTree = mergeTreeImages(tree, queuedTree);

            if (queuedRequest.clientId && queuedRequest.method === 'POST') {
              await replaceTreeId(queuedRequest.clientId, mergedTree);
            } else {
              await upsertTree(mergedTree);
            }

            if (mergedTree.address?.id) {
              await recalculateAddressCompletion(mergedTree.address.id);
            }
          }
        }

        if (queuedRequest.method === 'DELETE') {
          const treeId = parseInt(queuedRequest.url.split('/').pop() || '0', 10);
          if (treeId) {
            await deleteTreeById(treeId);
          }
        }
      }

      if (queuedRequest.url.includes('/api/address/bulk-finish') && Array.isArray(responseData)) {
        await saveAddresses(responseData as Address[]);
      }

      successfulRequests.push(queuedRequest.id);
    } catch (error) {
      console.error(`✗ Failed to process: ${queuedRequest.description}`, error);
      failedRequests.push({
        request: queuedRequest,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Remove successful requests from queue
  for (const id of successfulRequests) {
    await removeFromQueue(id);
  }

  // Show notification about results
  if (successfulRequests.length > 0) {
    notifier.success(`${successfulRequests.length} offline wijziging(en) verzonden`, {
      icon: 'cloud_done',
      timeout: 4000,
    });
  }

  if (failedRequests.length > 0) {
    notifier.warning(`${failedRequests.length} wijziging(en) konden niet worden verzonden`, {
      icon: 'cloud_off',
      timeout: 5000,
      actions: [
        {
          label: 'Opnieuw',
          color: 'white',
          handler: () => void processPendingRequests(),
        },
      ],
    });
  }
}

/**
 * Initialize offline queue system with event listeners
 */
function initializeOfflineQueue(): void {
  const notifier = useAppNotify();

  if (queueInitialized) {
    return;
  }

  queueInitialized = true;

  // Process queue when connection is restored
  window.addEventListener('online', () => {
    void processPendingRequests();
  });

  // Show notification when going offline
  window.addEventListener('offline', () => {
    notifier.info('Offline modus geactiveerd - wijzigingen worden later verzonden', {
      icon: 'cloud_off',
    });
  });

  // Process pending requests on startup if online
  if (navigator.onLine) {
    void processPendingRequests();
  }
}

export function useOfflineQueue() {
  return {
    addToQueue,
    getQueue,
    getQueueCount,
    removeFromQueue,
    updateQueuedRequestDataByClientId,
    removeQueuedRequestByClientId,
    clearQueue,
    processPendingRequests,
    initializeOfflineQueue,
  };
}

export type { QueuedRequest } from 'src/models/QueuedRequest';
