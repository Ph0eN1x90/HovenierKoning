// API composable - handles HTTP requests only
// IndexedDB dataset logic is in useIndexedDbData.ts
// Offline queue logic is in useOfflineQueue.ts

import { inject, ref } from 'vue';
import type { AxiosError, AxiosInstance } from 'axios';
import { Loading } from 'quasar';
import { useIndexedDbData } from './useIndexedDbData';
import { useOfflineQueue } from './useOfflineQueue';
import { getIndexedDb } from './useIndexedDb';
import { useAppNotify } from './useAppNotify';
import type { Address } from 'src/models/Address';
import type { Tree } from 'src/models/Tree';

let activeLoadingRequests = 0;
const OFFLINE_QUEUED_MESSAGE = 'Offline: wijziging wordt later verzonden';

function beginLoading() {
  activeLoadingRequests += 1;
  if (activeLoadingRequests === 1) {
    Loading.show({
      delay: 200,
      message: 'Bezig met laden...',
      spinnerColor: 'primary',
    });
  }
}

function endLoading() {
  activeLoadingRequests = Math.max(0, activeLoadingRequests - 1);
  if (activeLoadingRequests === 0) {
    Loading.hide();
  }
}

function getFriendlyApiCaption(error: AxiosError): string {
  if (!navigator.onLine || error.code === 'ERR_NETWORK') {
    return 'Controleer je internetverbinding en probeer opnieuw.';
  }

  const status = error.response?.status;
  switch (status) {
    case 400:
      return 'De aanvraag is ongeldig. Controleer je invoer.';
    case 401:
      return 'Je sessie is verlopen. Log opnieuw in.';
    case 403:
      return 'Je hebt geen rechten om deze actie uit te voeren.';
    case 404:
      return 'De gevraagde gegevens zijn niet gevonden.';
    case 409:
      return 'Er is een conflict met bestaande gegevens.';
    case 422:
      return 'Ingevoerde gegevens zijn niet valide.';
    case 500:
    case 502:
    case 503:
      return 'Server tijdelijk niet beschikbaar. Probeer later opnieuw.';
    default:
      return 'Er is een onverwachte fout opgetreden.';
  }
}

export function useApi() {
  const api = inject<AxiosInstance>('api');
  if (!api) {
    throw new Error('API instance not provided. Ensure boot/axios is registered and provides "api".');
  }
  const apiClient = api;

  const loading = ref(false);
  const error = ref<string | null>(null);
  const notifier = useAppNotify();

  const {
    saveAddresses,
    upsertAddress,
    getAllAddresses,
    getAddressById,
    getAddressesByStreet,
    markAddressesFinished,
    saveTrees,
    upsertTree,
    getTreeById,
    deleteTreeById,
    getTreesByAddressId,
    recalculateAddressCompletion,
  } = useIndexedDbData();

  const {
    addToQueue,
    updateQueuedRequestDataByClientId,
    removeQueuedRequestByClientId,
  } = useOfflineQueue();

  function generateLocalTreeId(): number {
    return -1 * Date.now();
  }

  function normalizeTreeForQueue(tree: Tree, queuedId: number | null): Tree {
    return {
      ...tree,
      id: queuedId,
      treeimage: (tree.treeimage || []).map(img => ({
        ...img,
        tree: { id: queuedId },
      })),
    };
  }

  async function getOfflineData<T>(url: string): Promise<T | null> {
    if (url === '/api/address/' || url === '/api/address') {
      return await getAllAddresses() as T;
    }

    if (url.startsWith('/api/address/street/')) {
      const street = decodeURIComponent(url.replace('/api/address/street/', ''));
      return await getAddressesByStreet(street) as T;
    }

    if (url.startsWith('/api/address/')) {
      const id = parseInt(url.replace('/api/address/', ''), 10);
      if (!Number.isNaN(id)) {
        return await getAddressById(id) as T;
      }
    }

    if (url === '/api/trees/all' || url === '/api/trees/all/') {
      // Return all cached trees
      const db = await getIndexedDb();
      return await db.getAll('trees') as T;
    }

    if (url.startsWith('/api/trees/all/')) {
      const addressId = parseInt(url.replace('/api/trees/all/', ''), 10);
      if (!Number.isNaN(addressId)) {
        return await getTreesByAddressId(addressId) as T;
      }
    }

    if (url.startsWith('/api/trees/')) {
      const treeId = parseInt(url.replace('/api/trees/', ''), 10);
      if (!Number.isNaN(treeId)) {
        return await getTreeById(treeId) as T;
      }
    }

    return null;
  }

  async function persistResponseData(url: string, data: unknown): Promise<void> {
    if (url.includes('/api/address/bulk-finish')) {
      if (Array.isArray(data)) {
        await saveAddresses(data as Address[]);
      }
      return;
    }

    if (url === '/api/address/' || url === '/api/address') {
      if (Array.isArray(data)) {
        const addresses = data as Address[];
        const allTrees: Tree[] = [];
        addresses.forEach(address => {
          if (address.trees && address.trees.length > 0) {
            allTrees.push(...address.trees);
          }
        });
        if (allTrees.length > 0) {
          queueTreeCaching(allTrees);
        }
        await saveAddresses(addresses);
      }
      return;
    }

    if (url.startsWith('/api/address/street/')) {
      if (Array.isArray(data)) {
        const addresses = data as Address[];
        const allTrees: Tree[] = [];
        addresses.forEach(address => {
          if (address.trees && address.trees.length > 0) {
            allTrees.push(...address.trees);
          }
        });
        if (allTrees.length > 0) {
          queueTreeCaching(allTrees);
        }
        await saveAddresses(addresses);
      }
      return;
    }

    if (url.startsWith('/api/address/')) {
      if (!Array.isArray(data) && data) {
        const address = data as Address;
        if (address.trees && address.trees.length > 0) {
          queueTreeCaching(address.trees);
        }
        await upsertAddress(address);
      }
      return;
    }

    if (url === '/api/trees/all' || url.startsWith('/api/trees/all/')) {
      if (Array.isArray(data)) {
        await saveTrees(data);
      } else if (data && typeof data === 'object' && 'data' in data) {
        // Handle { data: [...] } format
        const trees = (data as { data: Tree[] }).data;
        if (Array.isArray(trees)) {
          await saveTrees(trees);
        }
      }
      return;
    }

    if (url === '/api/trees' || url === '/api/trees/') {
      if (Array.isArray(data)) {
        await saveTrees(data as Tree[]);
      }
      return;
    }

    if (url.startsWith('/api/trees/')) {
      if (!Array.isArray(data) && data) {
        await upsertTree(data as Tree);
      }
      return;
    }
  }

  async function applyTreeUpsert(tree: Tree): Promise<void> {
    await upsertTree(tree);
    if (tree.address?.id) {
      await recalculateAddressCompletion(tree.address.id);
    }
  }

  async function applyTreeDelete(treeId: number, addressId?: number): Promise<void> {
    await deleteTreeById(treeId);
    if (addressId) {
      await recalculateAddressCompletion(addressId);
    }
  }

  function queueTreeCaching(trees: Tree[]): void {
    if (trees.length === 0) return;
    setTimeout(() => {
      void saveTrees(trees).catch((error) => {
        console.warn('[Cache] Tree image caching failed:', error);
      });
    }, 0);
  }

  async function prefetchTreesForCache(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    try {
      const { data } = await apiClient.get('/api/trees/all');
      await persistResponseData('/api/trees/all', data);
    } catch {
      // Silent fail - background caching shouldn't interrupt user experience
    }
  }

  /**
   * GET request with caching support
   *
  * Offline strategy:
  * - Online: fetch from network and persist to IndexedDB
  * - Offline: serve from IndexedDB
  * - On network error: fall back to IndexedDB if available
   */
  async function fetchData<T>(
    url: string,
    errorMessage = 'Er is een fout opgetreden',
    useCache = true
  ): Promise<T | null> {
    loading.value = true;
    beginLoading();
    error.value = null;

    if (!navigator.onLine && useCache) {
      const cached = await getOfflineData<T>(url);
      if (cached) {
        loading.value = false;
        endLoading();
        return cached;
      }
    }

    try {
      const { data } = await apiClient.get<T>(url);
      await persistResponseData(url, data);
      return data;
    } catch (err) {
      const axiosError = err as AxiosError;
      error.value = axiosError.message;
      console.error('[fetchData] API Error for URL:', url, {
        message: axiosError.message,
        status: axiosError.status,
        config: axiosError.config?.url
      });

      if (useCache) {
        const cached = await getOfflineData<T>(url);
        if (cached) {
          notifier.warning('Offline: opgeslagen data getoond', {
            icon: 'cloud_off',
          });
          loading.value = false;
          return cached;
        }
      }

      console.error('[fetchData] No cached data available, showing error notification');
      notifier.error(errorMessage, {
        caption: getFriendlyApiCaption(axiosError),
      });

      return null;
    } finally {
      loading.value = false;
      endLoading();
    }
  }

  /**
   * POST request with offline queue support
   *
   * Offline strategy:
   * - If online: send immediately
   * - If offline: add to queue for later sync
   */
  async function postData<T>(
    url: string,
    payload: unknown,
    successMessage = 'Gegevens opgeslagen',
    description?: string
  ): Promise<T | null> {
    loading.value = true;
    beginLoading();
    error.value = null;

    try {
      const { data } = await apiClient.post<T>(url, payload);

      if (url.includes('/api/trees')) {
        await applyTreeUpsert(data as Tree);
      }

      await persistResponseData(url, data);

      notifier.success(successMessage, {
        timeout: 2000,
      });

      return data;
    } catch (err) {
      const axiosError = err as AxiosError;
      error.value = axiosError.message;

      // If offline, queue the request for later
      if (axiosError.code === 'ERR_NETWORK' || !navigator.onLine) {
        if (url.includes('/api/trees')) {
          const treePayload = payload as Tree;
          const clientId = treePayload.id && treePayload.id < 0 ? treePayload.id : generateLocalTreeId();
          const localTree: Tree = { ...treePayload, id: clientId };
          const queueTree: Tree = normalizeTreeForQueue(treePayload, null);

          await applyTreeUpsert(localTree);

          await addToQueue({
            url,
            method: 'POST',
            data: queueTree,
            clientId,
            description: description || 'Data opslaan',
          });

          notifier.info(OFFLINE_QUEUED_MESSAGE, {
            icon: 'cloud_queue',
          });

          return localTree as T;
        }

        await addToQueue({
          url,
          method: 'POST',
          data: payload,
          description: description || 'Data opslaan',
        });

        notifier.info(OFFLINE_QUEUED_MESSAGE, {
          icon: 'cloud_queue',
        });

        return payload as T;
      }

      // Other errors (server error, validation error, etc.)
      notifier.error('Opslaan mislukt', {
        caption: getFriendlyApiCaption(axiosError),
      });

      return null;
    } finally {
      loading.value = false;
      endLoading();
    }
  }

  /**
   * PUT request with offline queue support
   */
  async function putData<T>(
    url: string,
    payload: unknown,
    successMessage = 'Gegevens bijgewerkt',
    description?: string
  ): Promise<T | null> {
    loading.value = true;
    beginLoading();
    error.value = null;

    try {
      const { data } = await apiClient.put<T>(url, payload);

      if (url.includes('/api/trees')) {
        await applyTreeUpsert(data as Tree);
      }

      if (url.includes('/api/address/bulk-finish')) {
        if (Array.isArray(data)) {
          await saveAddresses(data as Address[]);
        } else if (payload && typeof payload === 'object' && 'ids' in (payload as Record<string, unknown>)) {
          const ids = (payload as { ids: number[] }).ids;
          const date = new Date().toISOString().slice(0, 10);
          await markAddressesFinished(ids, date);
        }
      }

      await persistResponseData(url, data);

      notifier.success(successMessage, {
        timeout: 2000,
      });

      return data;
    } catch (err) {
      const axiosError = err as AxiosError;
      error.value = axiosError.message;

      // If offline, queue the request for later
      if (axiosError.code === 'ERR_NETWORK' || !navigator.onLine) {
        if (url.includes('/api/trees')) {
          const treePayload = payload as Tree;
          if (treePayload.id && treePayload.id < 0) {
            await applyTreeUpsert(treePayload);

            const updated = await updateQueuedRequestDataByClientId(treePayload.id, () => {
              const queueTree: Tree = normalizeTreeForQueue(treePayload, null);
              return queueTree;
            });

            if (!updated) {
              await addToQueue({
                url,
                method: 'PUT',
                data: normalizeTreeForQueue(treePayload, null),
                description: description || 'Data bijwerken',
              });
            }
          } else {
            await applyTreeUpsert(treePayload);

            await addToQueue({
              url,
              method: 'PUT',
              data: normalizeTreeForQueue(treePayload, treePayload.id ?? null),
              description: description || 'Data bijwerken',
            });
          }

          notifier.info(OFFLINE_QUEUED_MESSAGE, {
            icon: 'cloud_queue',
          });

          return payload as T;
        }

        if (url.includes('/api/address/bulk-finish')) {
          const ids = (payload as { ids: number[] }).ids || [];
          const date = new Date().toISOString().slice(0, 10);
          await markAddressesFinished(ids, date);

          await addToQueue({
            url,
            method: 'PUT',
            data: payload,
            description: description || 'Data bijwerken',
          });

          notifier.info(OFFLINE_QUEUED_MESSAGE, {
            icon: 'cloud_queue',
          });

          return payload as T;
        }

        await addToQueue({
          url,
          method: 'PUT',
          data: payload,
          description: description || 'Data bijwerken',
        });

        notifier.info(OFFLINE_QUEUED_MESSAGE, {
          icon: 'cloud_queue',
        });

        return payload as T;
      }

      // Other errors
      notifier.error('Bijwerken mislukt', {
        caption: getFriendlyApiCaption(axiosError),
      });

      return null;
    } finally {
      loading.value = false;
      endLoading();
    }
  }

  /**
   * DELETE request with offline queue support
   */
  async function deleteData(
    url: string,
    successMessage = 'Gegevens verwijderd',
    description?: string,
    treeForCache?: Tree
  ): Promise<boolean> {
    loading.value = true;
    beginLoading();
    error.value = null;

    // Extract tree ID from URL for cache update
    const treeId = url.includes('/api/trees/') ? parseInt(url.split('/').pop() || '0') : null;

    try {
      await apiClient.delete(url);

      if (url.includes('/api/trees') && treeId) {
        const treeToUse = treeForCache || await getTreeById(treeId);
        await applyTreeDelete(treeId, treeToUse?.address?.id);
      }

      notifier.success(successMessage, {
        timeout: 2000,
      });

      return true;
    } catch (err) {
      const axiosError = err as AxiosError;
      error.value = axiosError.message;

      // If offline, queue the request for later
      if (axiosError.code === 'ERR_NETWORK' || !navigator.onLine) {
        if (url.includes('/api/trees') && treeId) {
          const treeToUse = treeForCache || await getTreeById(treeId);
          const addressId = treeToUse?.address?.id;

          if (treeId < 0) {
            await removeQueuedRequestByClientId(treeId);
            await applyTreeDelete(treeId, addressId);
          } else {
            await addToQueue({
              url,
              method: 'DELETE',
              description: description || 'Data verwijderen',
            });

            await applyTreeDelete(treeId, addressId);
          }

          notifier.info(OFFLINE_QUEUED_MESSAGE, {
            icon: 'cloud_queue',
          });

          return true;
        }

        await addToQueue({
          url,
          method: 'DELETE',
          description: description || 'Data verwijderen',
        });

        notifier.info(OFFLINE_QUEUED_MESSAGE, {
          icon: 'cloud_queue',
        });

        return true;
      }

      // Other errors
      notifier.error('Verwijderen mislukt', {
        caption: getFriendlyApiCaption(axiosError),
      });

      return false;
    } finally {
      loading.value = false;
      endLoading();
    }
  }

  return {
    // State
    loading,
    error,

    // Methods
    fetchData,
    postData,
    putData,
    deleteData,
    prefetchTreesForCache,
  };
}
