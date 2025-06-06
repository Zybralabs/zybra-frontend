import { useMemo } from "react";

import { useMainnetSingleCallResult } from "@/lib/hooks/multicall";
import isZero from "@/utils/isZero";
import { safeNamehash } from "@/utils/safeNamehash";

import { useENSRegistrarContract, useENSResolverContract } from "./useContract";
import type { Contract } from "ethers";
import useDebounce from "@/utils/useDebounce";

/**
 * Does a lookup for an ENS name to find its address.
 */
export default function useENSAddress(ensName?: string | null): {
  loading: boolean;
  address: string | null;
} {
  const debouncedName = useDebounce(ensName, 200);
  const ensNodeArgument = useMemo(
    () => [debouncedName ? safeNamehash(debouncedName) : undefined],
    [debouncedName],
  );
  const registrarContract = useENSRegistrarContract() as Contract | null;
  const resolverAddressCall = useMainnetSingleCallResult(
    //@ts-ignore
    registrarContract,
    "resolver",
    ensNodeArgument,
  );
  const resolverAddress = resolverAddressCall.result?.[0];
  const resolverContract = useENSResolverContract(
    resolverAddress && !isZero(resolverAddress) ? resolverAddress : undefined,
  ) as Contract | null;

  const addressCall = useMainnetSingleCallResult(
    //@ts-ignore

    resolverContract,
    "addr",
    ensNodeArgument,
  );
  const address = addressCall.result?.[0];

  const changed = debouncedName !== ensName;
  return useMemo(
    () => ({
      address: changed ? null : (address ?? null),
      loading: changed || resolverAddressCall.loading || addressCall.loading,
    }),
    [addressCall.loading, address, changed, resolverAddressCall.loading],
  );
}
