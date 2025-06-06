import { useCallback, useEffect, useState } from "react";
import { type CBPayInstanceType, initOnRamp } from "@coinbase/cbpay-js";
interface UseCoinbasePayConfig {
  addresses: Record<string, string[]>; // Updated to match the expected type
  assets: string[];
  onSuccess?: () => void;
  onExit?: () => void;
  onEvent?: (event: any) => void;
  experienceLoggedIn?: "popup" | "embedded";
  experienceLoggedOut?: "popup" | "embedded";
  closeOnExit?: boolean;
  closeOnSuccess?: boolean;
}

export const useCoinbasePay = ({
  addresses,
  assets,
  onSuccess = () => console.log("Transaction successful"),
  onExit = () => console.log("Widget exited"),
  onEvent = (event) => console.log("Event", event),
  experienceLoggedIn = "popup",
  experienceLoggedOut = "popup",
  closeOnExit = true,
  closeOnSuccess = true,
}: UseCoinbasePayConfig) => {
  const [onrampInstance, setOnrampInstance] = useState<CBPayInstanceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const appId = process.env.NEXT_PUBLIC_COINBASE_APP_ID ?? "";

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setLoading(true);
      initOnRamp(
        {
          appId,
          widgetParameters: {
            addresses,
            assets,
          },
          onSuccess: () => {
            console.log("Transaction successful");
            setSuccess(true);
            setError(null);
            setLoading(false);
          },
          onExit: () => {
            console.log("Widget exited");
            setLoading(false);
          },
          onEvent,
          experienceLoggedIn,
          experienceLoggedOut,
          closeOnExit,
          closeOnSuccess,
        },
        (error, instance) => {
          if (error) {
            console.error("Error initializing Coinbase Pay:", error);
            setError("Failed to initialize Coinbase Pay.");
            setLoading(false);
          } else {
            setOnrampInstance(instance);
            setError(null);
            setLoading(false);
            setInitialized(true); // Mark as initialized
          }
        },
      );
    }
  
    return () => {
      onrampInstance?.destroy();
    };
  }, [appId, addresses, assets, initialized]); // Removed unnecessary dependencies
  

  const openCoinbasePay = useCallback(() => {
    if (onrampInstance) {
      if (!loading) {
        setSuccess(false);
        setError(null);
        setLoading(true);
        onrampInstance.open();
      }
    } else {
      setError("Coinbase Pay instance is not available.");
    }
  }, [onrampInstance, loading]);
  
  return { openCoinbasePay, onrampInstance, loading, error, success };
};