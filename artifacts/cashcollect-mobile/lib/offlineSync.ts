import { apiFetch } from "@/lib/api";
import {
  getOfflineCollections,
  setOfflineCollections,
  OfflineCollectionQueueItem,
} from "@/lib/offlineQueue";

async function syncOneItem(item: OfflineCollectionQueueItem) {
  if (item.action === "save-draft") {
    const res = await apiFetch("/api/collections", {
      method: "POST",
      body: JSON.stringify(item.payload),
    });

    if (!res.ok && res.status !== 409) {
      throw new Error(`Save draft sync failed: ${res.status}`);
    }

    return;
  }

  if (item.action === "submit") {
    const saveRes = await apiFetch("/api/collections", {
      method: "POST",
      body: JSON.stringify({
        ...item.payload,
        status: "entered",
      }),
    });

    if (!saveRes.ok && saveRes.status !== 409) {
      throw new Error(`Submit save sync failed: ${saveRes.status}`);
    }

    const saved = await saveRes.json();
    const collectionId = saved.id;

    if (!collectionId) {
      throw new Error("Submit sync failed: missing collection id");
    }

    const submitRes = await apiFetch(
      `/api/collections/${collectionId}/submit`,
      {
        method: "POST",
      },
    );

    if (!submitRes.ok) {
      throw new Error(`Submit sync failed: ${submitRes.status}`);
    }
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
