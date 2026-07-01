import AsyncStorage from "@react-native-async-storage/async-storage";

const OFFLINE_COLLECTION_QUEUE_KEY = "@cashcollect_offline_collection_queue";

export type OfflineCollectionAction = "save-draft" | "submit";

export type OfflineCollectionQueueItem = {
  id: string;
  action: OfflineCollectionAction;
  payload: any;
  createdAt: string;
};

export async function addOfflineCollection(
  item: Omit<OfflineCollectionQueueItem, "id" | "createdAt">,
) {
  const existing = await getOfflineCollections();

  const queuedItem: OfflineCollectionQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...item,
  };

  await AsyncStorage.setItem(
    OFFLINE_COLLECTION_QUEUE_KEY,
    JSON.stringify([...existing, queuedItem]),
  );

  return queuedItem;
}

export async function getOfflineCollections(): Promise<
  OfflineCollectionQueueItem[]
> {
  const raw = await AsyncStorage.getItem(OFFLINE_COLLECTION_QUEUE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function clearOfflineCollections() {
  await AsyncStorage.removeItem(OFFLINE_COLLECTION_QUEUE_KEY);
}

export async function setOfflineCollections(
  items: OfflineCollectionQueueItem[],
) {
  await AsyncStorage.setItem(
    OFFLINE_COLLECTION_QUEUE_KEY,
    JSON.stringify(items),
  );
}
