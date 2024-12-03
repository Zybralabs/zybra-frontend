import React, { useCallback, type FC, type ChangeEvent } from "react";

import Image from "next/image";
import { isAddress, zeroAddress } from "viem";
import { useEnsResolver } from "wagmi";

import { useNotify } from "@/hooks";
import useDebounce from "@/hooks/useDebounce";

import Jazzicons from "./Jazzicons";
import warningImage from "../../../public/img/warning.svg";

interface AddressInputProps {
  receiver: string;
  setReceiver: (receiver: string) => void;
}

const AddressInput: FC<AddressInputProps> = ({ receiver, setReceiver }) => {
  const {
    data: resolvedAddress,
    isLoading: isResolvingInProgress,
    isError,
    error,
  } = useEnsResolver({
    name: receiver,
  });

  const debouncedReceiver = useDebounce(receiver, 2000);
  const { notifyError } = useNotify();

  const isValidEthAddress = (value: string) => value.startsWith("0x") && value.length === 42;

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;
      setReceiver(value);

      // If we have a resolved address from the ENS and it's valid, update the state
      if (resolvedAddress && resolvedAddress !== zeroAddress) {
        setReceiver(resolvedAddress);
      }
      // If the ENS resolver returns an error, notify the user
      else if (debouncedReceiver && isError) {
        notifyError({
          title: "Error:",
          message: error?.message ?? "Invalid address or ENS name.",
        });
      }
    },
    [resolvedAddress, debouncedReceiver, isError, error?.message, notifyError, setReceiver],
  );

  const getAddonContent = (): JSX.Element | null => {
    if (isResolvingInProgress) return <></>;
    const validAddress = isValidEthAddress(receiver)
      ? receiver
      : isAddress(resolvedAddress as string) && resolvedAddress !== zeroAddress
        ? resolvedAddress
        : undefined;

    if (validAddress) return <Jazzicons seed={validAddress.toLowerCase()} size={30} />;
    if (!resolvedAddress && receiver && !isResolvingInProgress)
      return (
        <Image
          alt="warning icon"
          src={warningImage.src}
          className="icon-wrapper error-icon"
          width={30}
          height={30}
        />
      );
    return null;
  };

  return <></>;
};

export default AddressInput;
