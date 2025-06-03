import { useCallback, useEffect, useState, useRef } from 'react';
import { useUserAccount } from '@/context/UserAccountContext';
import { fromWei } from '@/hooks/formatting';

// Types for TVL data
export interface TVLMetrics {
  total: number;
  staking: number;
  lending: number;
  borrowing: number;
  by_asset: Record<string, { lending: number; borrowing: number }>;
  by_pool: Record<string, { staking: number; borrowing: number }>;
  transaction_counts: {
    staking: number;
    lending: number;
    borrowing: number;
    total: number;
  };
}

export interface TVLBreakdownData {
  current: {
    staking: number;
    lending: number;
    borrowing: number;
    total: number;
  };
  historical: {
    dates: string[];
    staking: number[];
    lending: number[];
    borrowing: number[];
    total: number[];
  };
  top_assets: Array<{ address: string; amount: number }>;
  top_pools: Array<{ address: string; amount: number }>;
  period: string;
}

// Define types for the raw data from API
interface RawTVLMetrics {
  total: string | number;
  staking: string | number;
  lending: string | number;
  borrowing: string | number;
  by_asset: Record<string, { lending: string | number; borrowing: string | number }>;
  by_pool: Record<string, { staking: string | number; borrowing: string | number }>;
  transaction_counts: {
    staking: number;
    lending: number;
    borrowing: number;
    total: number;
  };
}

interface RawTVLBreakdownData {
  current: {
    staking: string | number;
    lending: string | number;
    borrowing: string | number;
    total: string | number;
  };
  historical: {
    dates: string[];
    staking: Array<string | number>;
    lending: Array<string | number>;
    borrowing: Array<string | number>;
    total: Array<string | number>;
  };
  top_assets: Array<{ address: string; amount: string | number }>;
  top_pools: Array<{ address: string; amount: string | number }>;
  period: string;
}

// Convert wei values to ether in TVL metrics with error handling
const convertWeiToEther = (metrics: RawTVLMetrics): TVLMetrics => {
  try {
    // Create a safe conversion function that handles errors
    const safeFromWei = (value: string | number): number => {
      try {
        return fromWei(value);
      } catch (error) {
        console.error(`Error converting value to ether: ${value}`, error);
        return 0;
      }
    };

    return {
      total: safeFromWei(metrics.total),
      staking: safeFromWei(metrics.staking),
      lending: safeFromWei(metrics.lending),
      borrowing: safeFromWei(metrics.borrowing),
      by_asset: Object.entries(metrics.by_asset || {}).reduce((acc, [key, value]) => {
        try {
          acc[key] = {
            lending: safeFromWei(value.lending),
            borrowing: safeFromWei(value.borrowing)
          };
        } catch (error) {
          console.error(`Error processing asset ${key}:`, error);
          acc[key] = { lending: 0, borrowing: 0 };
        }
        return acc;
      }, {} as Record<string, { lending: number; borrowing: number }>),
      by_pool: Object.entries(metrics.by_pool || {}).reduce((acc, [key, value]) => {
        try {
          acc[key] = {
            staking: safeFromWei(value.staking),
            borrowing: safeFromWei(value.borrowing)
          };
        } catch (error) {
          console.error(`Error processing pool ${key}:`, error);
          acc[key] = { staking: 0, borrowing: 0 };
        }
        return acc;
      }, {} as Record<string, { staking: number; borrowing: number }>),
      transaction_counts: metrics.transaction_counts || { staking: 0, lending: 0, borrowing: 0, total: 0 }
    };
  } catch (error) {
    console.error('Error converting TVL metrics from wei to ether:', error);
    console.log('Raw metrics that caused the error:', JSON.stringify(metrics, null, 2));

    // Return safe default values
    return {
      total: 0,
      staking: 0,
      lending: 0,
      borrowing: 0,
      by_asset: {},
      by_pool: {},
      transaction_counts: { staking: 0, lending: 0, borrowing: 0, total: 0 }
    };
  }
};

// Convert wei values to ether in TVL breakdown data with error handling
const convertBreakdownWeiToEther = (breakdown: RawTVLBreakdownData): TVLBreakdownData => {
  try {
    // Create a safe conversion function that handles errors
    const safeFromWei = (value: string | number): number => {
      try {
        return fromWei(value);
      } catch (error) {
        console.error(`Error converting value to ether: ${value}`, error);
        return 0;
      }
    };

    // Safe map function that handles errors
    const safeMap = <T, R>(array: T[] | undefined, mapFn: (item: T) => R, defaultValue: R[]): R[] => {
      if (!array || !Array.isArray(array)) return defaultValue;

      return array.map((item, index) => {
        try {
          return mapFn(item);
        } catch (error) {
          console.error(`Error mapping item at index ${index}:`, error);
          // Return a default value for this item
          return defaultValue[0];
        }
      });
    };

    return {
      current: {
        staking: safeFromWei(breakdown.current?.staking || 0),
        lending: safeFromWei(breakdown.current?.lending || 0),
        borrowing: safeFromWei(breakdown.current?.borrowing || 0),
        total: safeFromWei(breakdown.current?.total || 0)
      },
      historical: {
        dates: breakdown.historical?.dates || [],
        staking: safeMap(
          breakdown.historical?.staking,
          val => safeFromWei(val),
          [0]
        ),
        lending: safeMap(
          breakdown.historical?.lending,
          val => safeFromWei(val),
          [0]
        ),
        borrowing: safeMap(
          breakdown.historical?.borrowing,
          val => safeFromWei(val),
          [0]
        ),
        total: safeMap(
          breakdown.historical?.total,
          val => safeFromWei(val),
          [0]
        )
      },
      top_assets: safeMap(
        breakdown.top_assets,
        asset => ({
          address: asset.address || '',
          amount: safeFromWei(asset.amount)
        }),
        [{ address: '', amount: 0 }]
      ),
      top_pools: safeMap(
        breakdown.top_pools,
        pool => ({
          address: pool.address || '',
          amount: safeFromWei(pool.amount)
        }),
        [{ address: '', amount: 0 }]
      ),
      period: breakdown.period || '30d'
    };
  } catch (error) {
    console.error('Error converting TVL breakdown from wei to ether:', error);
    console.log('Raw breakdown that caused the error:', JSON.stringify(breakdown, null, 2));

    // Return safe default values
    return {
      current: {
        staking: 0,
        lending: 0,
        borrowing: 0,
        total: 0
      },
      historical: {
        dates: [],
        staking: [],
        lending: [],
        borrowing: [],
        total: []
      },
      top_assets: [],
      top_pools: [],
      period: '30d'
    };
  }
};

// Hook to fetch TVL metrics with fallback
export const useTVLMetrics = () => {
  const { getTVLMetrics, getSimpleTVLMetrics } = useUserAccount();
  const [data, setData] = useState<TVLMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  // Use a ref to track if we have data without causing re-renders
  const dataRef = useRef<TVLMetrics | null>(null);

  // Use a ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef<boolean>(false);

  const fetchTVLMetrics = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Already fetching TVL metrics, skipping duplicate request');
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Try the main TVL endpoint first
      console.log('Fetching TVL metrics from main endpoint...');
      const response = await getTVLMetrics();

      if (response.success) {
        console.log('TVL metrics fetched successfully from main endpoint');
        // Convert wei values to ether
        const convertedData = convertWeiToEther(response.payload as RawTVLMetrics);
        setData(convertedData);
        dataRef.current = convertedData;
        setUsedFallback(false);

        // Store debug info if available
        if (response.payload?.debug_info) {
          setDebugInfo(response.payload.debug_info);
        }
      } else {
        // If main endpoint fails, try the simplified fallback
        console.warn(`Main TVL endpoint failed: ${response.message}, trying simplified fallback`);

        try {
          console.log('Fetching TVL metrics from simplified endpoint...');
          const fallbackResponse = await getSimpleTVLMetrics();

          if (fallbackResponse.success) {
            console.log('TVL metrics fetched successfully from simplified endpoint');
            const convertedData = convertWeiToEther(fallbackResponse.payload as RawTVLMetrics);
            setData(convertedData);
            dataRef.current = convertedData;
            setUsedFallback(true);

            // Store debug info if available
            if (fallbackResponse.payload?.debug_info) {
              setDebugInfo(fallbackResponse.payload.debug_info);
            }
          } else {
            console.error(`Simplified TVL endpoint failed: ${fallbackResponse.message}`);
            setError(fallbackResponse.message || 'Failed to fetch TVL metrics');

            // If we don't have existing data, set to null
            if (!dataRef.current) {
              setData(null);
            }
          }
        } catch (fallbackErr: unknown) {
          console.error('Error fetching simplified TVL metrics:', fallbackErr);
          const errorMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
          setError(`Failed to fetch TVL metrics: ${errorMessage}`);

          // If we don't have existing data, set to null
          if (!dataRef.current) {
            setData(null);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching TVL metrics:', err);
      const mainErrorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Try the simplified fallback if the main endpoint throws an error
      try {
        console.warn('Main TVL endpoint error, trying simplified fallback');
        const fallbackResponse = await getSimpleTVLMetrics();

        if (fallbackResponse.success) {
          console.log('TVL metrics fetched successfully from simplified endpoint');
          const convertedData = convertWeiToEther(fallbackResponse.payload as RawTVLMetrics);
          setData(convertedData);
          dataRef.current = convertedData;
          setUsedFallback(true);

          // Store debug info if available
          if (fallbackResponse.payload?.debug_info) {
            setDebugInfo(fallbackResponse.payload.debug_info);
          }
        } else {
          console.error(`Simplified TVL endpoint failed: ${fallbackResponse.message}`);
          setError(fallbackResponse.message || 'Failed to fetch TVL metrics');

          // If we don't have existing data, set to null
          if (!dataRef.current) {
            setData(null);
          }
        }
      } catch (fallbackErr: unknown) {
        console.error('Error fetching simplified TVL metrics:', fallbackErr);
        const fallbackErrorMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
        setError(`Failed to fetch TVL metrics: ${mainErrorMessage}. Fallback also failed: ${fallbackErrorMessage}`);

        // If we don't have existing data, set to null
        if (!dataRef.current) {
          setData(null);
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [getTVLMetrics, getSimpleTVLMetrics]);

  // Only fetch on mount and when explicitly called via refetch
  useEffect(() => {
    fetchTVLMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refetch: fetchTVLMetrics, usedFallback, debugInfo };
};

// Hook to fetch TVL breakdown with time period and fallback
export const useTVLBreakdown = (period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d') => {
  const { getTVLBreakdown, getSimpleTVLBreakdown } = useUserAccount();
  const [data, setData] = useState<TVLBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  // Use a ref to track if we have data without causing re-renders
  const dataRef = useRef<TVLBreakdownData | null>(null);

  // Use a ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef<boolean>(false);

  // Use a ref to track the current period to avoid unnecessary fetches
  const currentPeriodRef = useRef<string>(period);

  const fetchTVLBreakdown = useCallback(async () => {
    // If period has changed, we should fetch new data
    const periodChanged = currentPeriodRef.current !== period;
    currentPeriodRef.current = period;

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current && !periodChanged) {
      console.log(`Already fetching TVL breakdown for period ${period}, skipping duplicate request`);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Try the main TVL breakdown endpoint first
      console.log(`Fetching TVL breakdown from main endpoint for period: ${period}...`);
      const response = await getTVLBreakdown(period);

      if (response.success) {
        console.log('TVL breakdown fetched successfully from main endpoint');
        // Convert wei values to ether
        const convertedData = convertBreakdownWeiToEther(response.payload as RawTVLBreakdownData);
        setData(convertedData);
        dataRef.current = convertedData;
        setUsedFallback(false);

        // Store debug info if available
        if (response.payload?.debug_info) {
          setDebugInfo(response.payload.debug_info);
        }
      } else {
        // If main endpoint fails, try the simplified fallback
        console.warn(`Main TVL breakdown endpoint failed: ${response.message}, trying simplified fallback`);

        try {
          console.log(`Fetching TVL breakdown from simplified endpoint for period: ${period}...`);
          const fallbackResponse = await getSimpleTVLBreakdown(period);

          if (fallbackResponse.success) {
            console.log('TVL breakdown fetched successfully from simplified endpoint');
            const convertedData = convertBreakdownWeiToEther(fallbackResponse.payload as RawTVLBreakdownData);
            setData(convertedData);
            dataRef.current = convertedData;
            setUsedFallback(true);

            // Store debug info if available
            if (fallbackResponse.payload?.debug_info) {
              setDebugInfo(fallbackResponse.payload.debug_info);
            }
          } else {
            console.error(`Simplified TVL breakdown endpoint failed: ${fallbackResponse.message}`);
            setError(fallbackResponse.message || 'Failed to fetch TVL breakdown');

            // If we don't have existing data, set to null
            if (!dataRef.current) {
              setData(null);
            }
          }
        } catch (fallbackErr: unknown) {
          console.error('Error fetching simplified TVL breakdown:', fallbackErr);
          const errorMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
          setError(`Failed to fetch TVL breakdown: ${errorMessage}`);

          // If we don't have existing data, set to null
          if (!dataRef.current) {
            setData(null);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching TVL breakdown:', err);
      const mainErrorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Try the simplified fallback if the main endpoint throws an error
      try {
        console.warn('Main TVL breakdown endpoint error, trying simplified fallback');
        const fallbackResponse = await getSimpleTVLBreakdown(period);

        if (fallbackResponse.success) {
          console.log('TVL breakdown fetched successfully from simplified endpoint');
          const convertedData = convertBreakdownWeiToEther(fallbackResponse.payload as RawTVLBreakdownData);
          setData(convertedData);
          dataRef.current = convertedData;
          setUsedFallback(true);

          // Store debug info if available
          if (fallbackResponse.payload?.debug_info) {
            setDebugInfo(fallbackResponse.payload.debug_info);
          }
        } else {
          console.error(`Simplified TVL breakdown endpoint failed: ${fallbackResponse.message}`);
          setError(fallbackResponse.message || 'Failed to fetch TVL breakdown');

          // If we don't have existing data, set to null
          if (!dataRef.current) {
            setData(null);
          }
        }
      } catch (fallbackErr: unknown) {
        console.error('Error fetching simplified TVL breakdown:', fallbackErr);
        const fallbackErrorMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
        setError(`Failed to fetch TVL breakdown: ${mainErrorMessage}. Fallback also failed: ${fallbackErrorMessage}`);

        // If we don't have existing data, set to null
        if (!dataRef.current) {
          setData(null);
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [getTVLBreakdown, getSimpleTVLBreakdown, period]);

  // Update period ref when period changes
  useEffect(() => {
    currentPeriodRef.current = period;
  }, [period]);

  // Fetch when period changes or when explicitly called via refetch
  useEffect(() => {
    fetchTVLBreakdown();
  }, [fetchTVLBreakdown]);

  return { data, loading, error, refetch: fetchTVLBreakdown, usedFallback, debugInfo };
};

