import { useEffect, useState } from "react";
import * as Network from "expo-network";
import { syncOfflineCollections } from "@/lib/offlineSync";

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedCount, setLastSyncedCount] = useState(0);

  async function runSync() {
    if (isSyncing) return;

    const networkState = await Network.getNetworkStateAsync();

    if (!networkState.isConnected || !networkState.isInternetReachable) {
      return;
    }

    setIsSyncing(true);

    try {
      const result = await syncOfflineCollections();
      setLastSyncedCount(result.synced);
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    runSync();

    const timer = setInterval(() => {
      runSync();
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  return {
    isSyncing,
    lastSyncedCount,
    runSync,
  };
}
