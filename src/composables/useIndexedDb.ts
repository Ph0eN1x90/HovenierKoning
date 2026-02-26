import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Address } from 'src/models/Address';
import type { Tree } from 'src/models/Tree';
import type { TreeImage } from 'src/models/TreeImage';
import type { QueuedRequest } from 'src/models/QueuedRequest';

export interface AppDbSchema extends DBSchema {
  addresses: {
    key: number;
    value: Address;
    indexes: { 'by-streetname': string };
  };
  trees: {
    key: number;
    value: Tree;
    indexes: { 'by-addressId': number };
  };
  treeimages: {
    key: number;
    value: TreeImage;
    indexes: { 'by-treeId': number };
  };
  queue: {
    key: string;
    value: QueuedRequest;
    indexes: { 'by-timestamp': number; 'by-clientId': number };
  };
}

const DB_NAME = 'HovenierKoning_DB';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<AppDbSchema>> | null = null;

export function getIndexedDb(): Promise<IDBPDatabase<AppDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains('addresses')) {
          const addressStore = db.createObjectStore('addresses', { keyPath: 'id' });
          addressStore.createIndex('by-streetname', 'streetname');
        }

        if (!db.objectStoreNames.contains('trees')) {
          const treeStore = db.createObjectStore('trees', { keyPath: 'id' });
          treeStore.createIndex('by-addressId', 'address.id');
        }

        if (!db.objectStoreNames.contains('treeimages')) {
          const treeImageStore = db.createObjectStore('treeimages', { keyPath: 'id', autoIncrement: true });
          treeImageStore.createIndex('by-treeId', 'tree.id');
        }

        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
          queueStore.createIndex('by-timestamp', 'timestamp');
          queueStore.createIndex('by-clientId', 'clientId');
        } else if (transaction) {
          const queueStore = transaction.objectStore('queue');
          if (!queueStore.indexNames.contains('by-clientId')) {
            queueStore.createIndex('by-clientId', 'clientId');
          }
        }

        if (db.objectStoreNames.contains('treeimages') && transaction) {
          const treeImageStore = transaction.objectStore('treeimages');
          if (!treeImageStore.indexNames.contains('by-treeId')) {
            treeImageStore.createIndex('by-treeId', 'tree.id');
          }
        }
      },
    });
  }

  return dbPromise;
}

export function useIndexedDb() {
  return {
    getIndexedDb,
  };
}
