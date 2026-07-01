import { useEffect, useState } from "react";
import * as Network from "expo-network";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  async function checkNetwork() {
    const state = await Network.getNetworkStateAsync();
    setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
  }

  useEffect(() => {
    checkNetwork();

    const timer = setInterval(() => {
      checkNetwork();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return {
    isOnline,
    checkNetwork,
  };
}
