import { useEffect, useState } from "react";
import { getExternalParlorSummary, ApiError } from "@workspace/api-client-react";

export type ExternalSummaryData = {
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  source: string;
};

export function useExternalParlorSummary(
  parlorCode: string | undefined,
  date: string | undefined,
) {
  const [data, setData] = useState<ExternalSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parlorCode || !date) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getExternalParlorSummary(parlorCode, date)
      .then((result) => {
        if (cancelled) return;
        setData({
          cashAmount: result.cashAmount,
          couponAmount: result.couponAmount,
          ccAmount: result.ccAmount,
          source: result.source,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData(null);
        const message =
          err instanceof ApiError
            ? ((err.data as { error?: string } | null)?.error ??
              "External amount source is unavailable")
            : err instanceof Error
              ? err.message
              : "External amount source is unavailable";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [parlorCode, date]);

  return { data, isLoading, error };
}
