"use client";

import { useUserAccount } from "@/context/UserAccountContext";
import { ErrorModal, LoadingModal, SuccessModal } from "../Modal";

export function AlertModals() {
  const { alertModalData, alertModalCloseHandler } = useUserAccount();

  const {
    isLoading = false,
    isError = false,
    isSuccess = false,
    title = "",
    message = "",
    txHash,
    errorCode,
    loadingText,
    chainId,
  } = alertModalData || {};

  return (
    alertModalData && (
      <>
        <LoadingModal
          isOpen={isLoading}
          onClose={alertModalCloseHandler}
          title={title}
          message={message}
          loadingText={loadingText}
        />
        <SuccessModal
          isOpen={isSuccess}
          onClose={alertModalCloseHandler}
          title={title}
          message={message}
          txHash={txHash}
          chainId={chainId}
        />
        <ErrorModal
          isOpen={isError}
          onClose={alertModalCloseHandler}
          title={title}
          message={message}
          errorCode={errorCode}
        />
      </>
    )
  );
}
