import { type ReactNode, useCallback } from "react";

interface NotifyProps {
  title: string;
  message: ReactNode;
}

export const useNotify = () => {
  const notifySuccess = useCallback(({ title, message }: NotifyProps) => {}, []);

  const notifyError = useCallback(({ title, message }: NotifyProps) => {}, []);

  return {
    notifySuccess,
    notifyError,
  };
};
