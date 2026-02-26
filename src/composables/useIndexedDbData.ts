import { getIndexedDb } from './useIndexedDb';
import type { AppDbSchema } from './useIndexedDb';
import type { Address } from 'src/models/Address';
import type { Tree } from 'src/models/Tree';
import type { TreeImage } from 'src/models/TreeImage';
import { convertTreeImagesToBase64 } from './useImageConverter';

function sanitizeForIndexedDb<T>(data: T): T {
  try {
    return structuredClone(data);
  } catch {
    try {
      return JSON.parse(JSON.stringify(data)) as T;
    } catch {
      return data;
    }
  }
}

async function saveAddresses(addresses: Address[]): Promise<void> {
  await saveMany('addresses', addresses);
}

async function upsertAddress(address: Address): Promise<void> {
  await upsertOne('addresses', address);
}

async function getAllAddresses(): Promise<Address[]> {
  const addresses = await getAll('addresses');
  return hydrateAddressesTrees(addresses);
}

async function getAddressById(id: number): Promise<Address | null> {
  const address = await getById('addresses', id);
  if (!address) return null;
  return hydrateAddressTrees(address);
}

async function getAddressesByStreet(streetname: string): Promise<Address[]> {
  const db = await getIndexedDb();
  const addresses = await db.getAllFromIndex('addresses', 'by-streetname', streetname);
  return hydrateAddressesTrees(addresses);
}

async function markAddressesFinished(ids: number[], dateFinished: string): Promise<void> {
  const db = await getIndexedDb();
  const tx = db.transaction('addresses', 'readwrite');

  for (const id of ids) {
    const address = await tx.store.get(id);
    if (!address) continue;

    const updated: Address = {
      ...address,
      finished: true,
      date_finished: dateFinished,
    };
    await tx.store.put(updated);
  }

  await tx.done;
}

async function saveTrees(trees: Tree[]): Promise<void> {
  console.log('[saveTrees] Starting to save', trees.length, 'trees');
  try {
    const normalized = trees.map(normalizeTreeForStore);
    await saveMany('trees', normalized);
    console.log('[saveTrees] Trees stored in IndexedDB');
    await saveTreeImagesForTrees(trees);
    console.log('[saveTrees] All tree images processed');
  } catch (error) {
    console.error('[saveTrees] Error saving trees:', error);
    throw error;
  }
}

async function upsertTree(tree: Tree): Promise<void> {
  await upsertOne('trees', normalizeTreeForStore(tree));
  await saveTreeImagesForTree(tree);
}

async function replaceTreeId(oldId: number, tree: Tree): Promise<void> {
  await replaceById('trees', oldId, normalizeTreeForStore(tree));
  await replaceTreeImagesAfterIdChange(oldId, tree);
}

async function getTreeById(id: number): Promise<Tree | null> {
  const tree = await getById('trees', id);
  if (!tree) return null;
  return hydrateTreeImages(tree);
}

async function deleteTreeById(id: number): Promise<void> {
  await deleteById('trees', id);
  await deleteTreeImagesByTreeId(id);
}

async function getTreesByAddressId(addressId: number): Promise<Tree[]> {
  const db = await getIndexedDb();
  const trees = await db.getAllFromIndex('trees', 'by-addressId', addressId);
  return hydrateTreesImages(trees);
}

async function hydrateAddressTrees(address: Address): Promise<Address> {
  const trees = await getTreesByAddressId(address.id);
  return {
    ...address,
    trees,
  };
}

async function hydrateAddressesTrees(addresses: Address[]): Promise<Address[]> {
  const hydrated: Address[] = [];
  for (const address of addresses) {
    hydrated.push(await hydrateAddressTrees(address));
  }
  return hydrated;
}

async function recalculateAddressCompletion(addressId: number): Promise<void> {
  const address = await getAddressById(addressId);
  if (!address) return;

  const trees = await getTreesByAddressId(addressId);
  const allTreesFinished = trees.length > 0 && trees.every(t => t.finished);
  const latestDate = trees
    .map(t => t.date_finished)
    .filter((d): d is string => d !== null)
    .sort()
    .pop();

  const updated: Address = {
    ...address,
    trees,
    finished: allTreesFinished,
    date_finished: allTreesFinished ? latestDate || null : null,
  };

  await upsertAddress(updated);
}

export function useIndexedDbData() {
  return {
    saveAddresses,
    upsertAddress,
    getAllAddresses,
    getAddressById,
    getAddressesByStreet,
    markAddressesFinished,
    saveTrees,
    upsertTree,
    replaceTreeId,
    getTreeById,
    deleteTreeById,
    getTreesByAddressId,
    recalculateAddressCompletion,
  };
}

type OfflineStoreName = 'addresses' | 'trees';
type StoreValue<K extends OfflineStoreName> = AppDbSchema[K]['value'];

async function saveMany<K extends OfflineStoreName>(
  storeName: K,
  items: StoreValue<K>[],
): Promise<void> {
  const db = await getIndexedDb();
  const tx = db.transaction(storeName, 'readwrite');
  for (const item of items) {
    const safeItem = sanitizeForIndexedDb(item);
    await tx.store.put(safeItem);
  }
  await tx.done;
}

async function upsertOne<K extends OfflineStoreName>(
  storeName: K,
  item: StoreValue<K>,
): Promise<void> {
  const db = await getIndexedDb();
  const safeItem = sanitizeForIndexedDb(item);
  await db.put(storeName, safeItem);
}

async function replaceById<K extends OfflineStoreName>(
  storeName: K,
  oldId: number,
  item: StoreValue<K>,
): Promise<void> {
  const db = await getIndexedDb();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.delete(oldId);
  const safeItem = sanitizeForIndexedDb(item);
  await tx.store.put(safeItem);
  await tx.done;
}

async function getAll<K extends OfflineStoreName>(storeName: K): Promise<StoreValue<K>[]> {
  const db = await getIndexedDb();
  return db.getAll(storeName) as Promise<StoreValue<K>[]>;
}

async function getById<K extends OfflineStoreName>(
  storeName: K,
  id: number,
): Promise<StoreValue<K> | null> {
  const db = await getIndexedDb();
  const item = await db.get(storeName, id);
  return (item ?? null) as StoreValue<K> | null;
}

async function deleteById(storeName: OfflineStoreName, id: number): Promise<void> {
  const db = await getIndexedDb();
  await db.delete(storeName, id);
}

async function saveTreeImagesForTrees(trees: Tree[]): Promise<void> {
  for (const tree of trees) {
    await saveTreeImagesForTree(tree);
  }
}

async function saveTreeImagesForTree(tree: Tree): Promise<void> {
  if (tree.id == null) return;
  const images = tree.treeimage ?? [];

  if (images.length === 0) {
    return;
  }

  try {
    console.log('[saveTreeImagesForTree] Converting', images.length, 'images for tree', tree.id);
    // Convert HTTP URLs to base64 for offline support
    const convertedImages = await convertTreeImagesToBase64(images);
    console.log('[saveTreeImagesForTree] Converted', convertedImages.length, 'images successfully');
    await replaceTreeImagesForTree(tree.id, convertedImages);
  } catch (error) {
    console.error('[saveTreeImagesForTree] Error converting images for tree', tree.id, ':', error);
    // Don't re-throw, just log - we still want to save the tree without images
  }
}

async function replaceTreeImagesAfterIdChange(oldId: number, tree: Tree): Promise<void> {
  if (tree.id == null) return;
  const images = await getTreeImagesByTreeId(oldId);
  if (images.length === 0) return;

  const updatedImages = images.map(img => ({
    ...img,
    id: null,
    tree: { id: tree.id },
  }));

  await replaceTreeImagesForTree(tree.id, updatedImages);
}

async function deleteTreeImagesByTreeId(treeId: number): Promise<void> {
  const db = await getIndexedDb();
  const tx = db.transaction('treeimages', 'readwrite');
  const index = tx.store.index('by-treeId');

  let cursor = await index.openCursor(IDBKeyRange.only(treeId));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

async function replaceTreeImagesForTree(treeId: number, images: TreeImage[]): Promise<void> {
  await deleteTreeImagesByTreeId(treeId);

  const db = await getIndexedDb();
  const tx = db.transaction('treeimages', 'readwrite');

  for (const [i, image] of images.entries()) {
    const safeImage = sanitizeForIndexedDb<TreeImage>({
      ...image,
      id: -(treeId * 10000 + i), // Generate unique negative ID for IndexedDB: -tree60 = -600000 to -600009
      tree: { id: treeId },
      imageurl: image.imageurl,
    });
    await tx.store.add(safeImage);
  }

  await tx.done;
}

function normalizeTreeForStore(tree: Tree): Tree {
  return {
    ...tree,
    treeimage: [],
  };
}

async function getTreeImagesByTreeId(treeId: number): Promise<TreeImage[]> {
  const db = await getIndexedDb();
  return db.getAllFromIndex('treeimages', 'by-treeId', treeId);
}

async function hydrateTreeImages(tree: Tree): Promise<Tree> {
  if (tree.id == null) return tree;
  const images = await getTreeImagesByTreeId(tree.id);
  return {
    ...tree,
    treeimage: images,
  };
}

async function hydrateTreesImages(trees: Tree[]): Promise<Tree[]> {
  const hydrated: Tree[] = [];
  for (const tree of trees) {
    hydrated.push(await hydrateTreeImages(tree));
  }
  return hydrated;
}
