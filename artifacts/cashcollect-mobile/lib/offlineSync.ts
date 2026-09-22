import {
  createCollection,
  submitCollection,
  ApiError,
} from "@workspace/api-client-react";
import {
  getOfflineCollections,
  setOfflineCollections,
  OfflineCollectionQueueItem,
} from "@/lib/offlineQueue";

async function syncOneItem(item: OfflineCollectionQueueItem) {
  if (item.action === "save-draft") {
    try {
      await createCollection(item.payload as any);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) {
        throw error;
      }
    }

    return;
  }

  if (item.action === "submit") {
    let saved;

    try {
      saved = await createCollection({
        ...(item.payload as any),
        status: "entered",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        throw new Error(
          "Submit sync failed: a collection already exists for this date and parlor",
        );
      }
      throw error;
    }

    const collectionId = saved.id;

    if (!collectionId) {
      throw new Error("Submit sync failed: missing collection id");
    }

    await submitCollection(collectionId);
  }
}

export async function syncOfflineCollections() {
  const queue = await getOfflineCollections();

  if (queue.length === 0) {
    return { synced: 0, remaining: 0 };
  }

  const remaining: OfflineCollectionQueueItem[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      await syncOneItem(item);
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  await setOfflineCollections(remaining);

  return {
    synced,
    remaining: remaining.length,
  };
}
