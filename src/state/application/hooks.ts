import { use, useCallback, useEffect, useMemo, useState } from 'react'

import {
  addPopup,
  ApplicationModal,
  type PopupContent,
  removePopup,
  savePools,
  setAssets,
  setBalanceSheetReports,
  setCashflowReports,
  setError,
  setFiatOnrampAvailability,
  setLoading,
  setOffers,
  setOpenModal,
  setPoolDetails,
  setProfitAndLossReports,
  setStakingInfo,
  setTrancheSnapshotsReports,
  setTransactions,
  setVaultData,
  setVaultInvestmentState,
} from './reducer'
import type { AppDispatch, AppState } from '..'

import { useAppDispatch, useAppSelector } from '../hooks'
import { DEFAULT_TXN_DISMISS_MS } from '@/constant/constant'
import useCentrifuge, { type ReportFilter } from '@/hooks/useCentrifugeRead'
import {useAssetsQuery, useTransactionsQuery, useOffersQuery, AssetQuery, AssetsQuery, OffersQuery } from '@/hooks/useSwarmQl';
import { useStakingInfo } from '../stake/hooks'
import type { SupportedChainId } from '@/constant/addresses'
import { useApolloClient, useQuery } from '@apollo/client'
import type { Vault } from '@centrifuge/sdk'
import { CONSERVATIVE_BLOCK_GAS_LIMIT } from '@uniswap/redux-multicall'
import type { PoolCardProps } from '@/components/MainPane/MainPane'
import { Rate } from '@centrifuge/centrifuge-js'

export function useModalIsOpen(modal: ApplicationModal): boolean {
  const openModal = useAppSelector((state: AppState) => state.application.openModal)
  return openModal === modal
}



async function getMoonpayAvailability(): Promise<boolean> {
  const moonpayPublishableKey = process.env.NEXT_PUBLIC_MOONPAY_PUBLISHABLE_KEY
  if (!moonpayPublishableKey) {
    throw new Error('Must provide a publishable key for moonpay.')
  }
  const moonpayApiURI = process.env.NEXT_PUBLIC_MOONPAY_API
  if (!moonpayApiURI) {
    throw new Error('Must provide an api endpoint for moonpay.')
  }
  return false
}



export function useFiatOnrampAvailability(shouldCheck: boolean, callback?: () => void) {
  const dispatch = useAppDispatch()
  const { available, availabilityChecked } = useAppSelector((state: AppState) => state.application.fiatOnramp)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {

    async function checkAvailability() {
      setError(null)
      setLoading(true)
      try {
        const result = await getMoonpayAvailability()
        if (stale) return
        dispatch(setFiatOnrampAvailability(false))
        if (result && callback) {
          callback()
        }
      } catch (e) {
        if (e instanceof Error) {
          console.error('Error checking onramp availability', e.toString())
        } else {
          console.error('Error checking onramp availability', String(e))
        }
        if (stale) return
        setError('Error, try again later.')
        dispatch(setFiatOnrampAvailability(false))
      } finally {
        if (!stale) setLoading(false)
      }
    }

    if (!availabilityChecked && shouldCheck) {
      checkAvailability()
    }

    let stale = false
    return () => {
      stale = true
    }
  }, [availabilityChecked, callback, dispatch, shouldCheck])

  return { available, availabilityChecked, loading, error }
}

export function useToggleModal(modal: ApplicationModal): () => void {
  const isOpen = useModalIsOpen(modal)
  const dispatch = useAppDispatch()
  return useCallback(() => dispatch(setOpenModal(isOpen ? null : modal)), [dispatch, modal, isOpen])
}

export function useCloseModal(): () => void {
  const dispatch = useAppDispatch()
  return useCallback(() => dispatch(setOpenModal(null)), [dispatch])
}

export function useOpenModal(modal: ApplicationModal): () => void {
  const dispatch = useAppDispatch()
  return useCallback(() => dispatch(setOpenModal(modal)), [dispatch, modal])
}

export function useToggleWalletModal(): () => void {
  return useToggleModal(ApplicationModal.WALLET)
}

export function useToggleWalletDropdown(): () => void {
  return useToggleModal(ApplicationModal.WALLET_DROPDOWN)
}


export function useToggleQueueModal(): () => void {
  return useToggleModal(ApplicationModal.QUEUE)
}

export function useToggleExecuteModal(): () => void {
  return useToggleModal(ApplicationModal.EXECUTE)
}

export function useTogglePrivacyPolicy(): () => void {
  return useToggleModal(ApplicationModal.PRIVACY_POLICY)
}

export function useToggleFeatureFlags(): () => void {
  return useToggleModal(ApplicationModal.FEATURE_FLAGS)
}

// returns a function that allows adding a popup
export function useAddPopup(): (content: PopupContent, key?: string, removeAfterMs?: number) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (content: PopupContent, key?: string, removeAfterMs?: number) => {
      dispatch(addPopup({ content, key, removeAfterMs: removeAfterMs ?? DEFAULT_TXN_DISMISS_MS }))
    },
    [dispatch]
  )
}

// returns a function that allows removing a popup via its key
export function useRemovePopup(): (key: string) => void {
  const dispatch = useAppDispatch()
  return useCallback(
    (key: string) => {
      dispatch(removePopup({ key }))
    },
    [dispatch]
  )
}

// get the list of active popups
export function useActivePopups(): AppState['application']['popupList'] {
  const list = useAppSelector((state: AppState) => state.application.popupList)
  return useMemo(() => list.filter((item) => item.show), [list])
}

export const selectAllPools  = (state: AppState) => state.application.allPools;
export const selectFilteredPools = (state: AppState) => state.application.filteredPools;

export const savePoolData = (allPools: any[], filteredPools: any[]) => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      
      // If needed, you could perform additional data processing here
      
      // Save the pools data to Redux
      dispatch(savePools({
        allPools,
        filteredPools
      }));
      
    } catch (error) {
      console.error('Error saving pool data:', error);
      if (error instanceof Error) {
        dispatch(setError(error.message));
      } else {
        dispatch(setError('An unknown error occurred'));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };
};
export function useLoadVaultData(): (poolId: string, chainId: number, trancheId: string, asset: string) => void {
  const dispatch = useAppDispatch();
  const { fetchVault } = useCentrifuge();

  return useCallback(
    async (poolId: string, chainId: number, trancheId: string, asset: string) => {
      dispatch(setLoading(true));
      try {
        const vault = await fetchVault(poolId, chainId, trancheId, asset);
        dispatch(setVaultData({ poolId, vault }));
      } catch (error) {
        console.error('Error fetching vault data:', error);
        if (error instanceof Error) {
          dispatch(setError(error.message || 'Failed to fetch pool details.'));
        } else {
          dispatch(setError('Failed to fetch pool details.'));
        }
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, fetchVault]
  );
}


export function useFetchInvestmentState() {
  const dispatch = useAppDispatch();

  return useCallback(
    async (vault: Vault, investorAddress: string) => {
      dispatch(setLoading(true));
      try {
        const investmentState = await vault.investment(investorAddress);
        dispatch(setVaultInvestmentState({ investorAddress, investmentState }));
      } catch (error: any) {
        console.error(`Error fetching investment state for investor ${investorAddress}:`, error);
        dispatch(
          setError(
            error.message || `Failed to fetch investment state for investor ${investorAddress}.`
          )
        );
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );
}




export function useLoadBalanceSheetReport(): (poolId: string, filter: ReportFilter) => void {
  const dispatch = useAppDispatch();
  const { fetchBalanceSheetReport } = useCentrifuge();

  return useCallback(
    async (poolId: string, filter: ReportFilter) => {
      dispatch(setLoading(true));
      try {
        const report = await fetchBalanceSheetReport(poolId, filter);
        dispatch(setBalanceSheetReports({ poolId, report }));
      } catch (error) {
        console.error('Error fetching balance sheet report:', error);
        if (error instanceof Error) {
          dispatch(setError(error.message || 'Failed to fetch pool details.'));
        } else {
          dispatch(setError('Failed to fetch pool details.'));
        }
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, fetchBalanceSheetReport]
  );
}

export function useLoadProfitAndLossReport(): (poolId: string, filter: ReportFilter) => void {
  const dispatch = useAppDispatch();
  const { fetchProfitAndLossReport } = useCentrifuge();

  return useCallback(
    async (poolId: string, filter: ReportFilter) => {
      dispatch(setLoading(true));
      try {
        const report = await fetchProfitAndLossReport(poolId, filter);
        dispatch(setProfitAndLossReports({ poolId, report }));
      } catch (error) {
        console.error('Error fetching profit and loss report:', error);
        if (error instanceof Error) {
          dispatch(setError(error.message || 'Failed to fetch pool details.'));
        } else {
          dispatch(setError('Failed to fetch pool details.'));
        }
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, fetchProfitAndLossReport]
  );
}

export function useLoadCashflowReport(): (poolId: string, filter: ReportFilter) => void {
  const dispatch = useAppDispatch();
  const { fetchCashflowReport } = useCentrifuge();

  return useCallback(
    async (poolId: string, filter: ReportFilter) => {
      dispatch(setLoading(true));
      try {
        const report = await fetchCashflowReport(poolId, filter);
        dispatch(setCashflowReports({ poolId, report }));
      } catch (error) {
        console.error('Error fetching cashflow report:', error);
        if (error instanceof Error) {
          dispatch(setError(error.message || 'Failed to fetch pool details.'));
        } else {
          dispatch(setError('Failed to fetch pool details.'));
        }
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, fetchCashflowReport]
  );
}




export function useLoadOffers() {
  const dispatch = useAppDispatch();
 const client = useApolloClient();
  return useCallback(
    async (variables: { first?: number; skip?: number; orderBy?: string; orderDirection?: string }) => {
      dispatch(setLoading(true));
      try {
       
        const { data , error, loading} = await client.query({
          query: OffersQuery,
          variables: {
            first: variables.first || 25,
            skip: variables.skip || 2,
            orderBy: variables.orderBy || "id",
            orderDirection: variables.orderDirection || "asc",
          },
        });
        console.log('_____________data', data);
      
        dispatch(setOffers(data?.offers ?? []));
      } catch (error: any) {
        console.error('Error fetching offers:', error);
        dispatch(setError(error.message || 'Failed to fetch offers.'));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [client,dispatch]
  );
}

/**
 * Hook to fetch assets and dispatch to the store.
 */
// export function useLoadAssets(): (
//   variables: { first?: number; skip?: number; orderBy?: string; orderDirection?: string }
// ) => Promise<void> {
//   const dispatch = useAppDispatch();
//    const fetchAssets = useQuery(AssetsQuery, {
//       variables: { first: 10, skip: 0, orderDirection: "asc" },
//     });
//         console.log('data', fetchAssets);

//   return useCallback(
//     async () => {
//       dispatch(setLoading(true));
//       try {
//         const { data, error } =  fetchAssets;
//         console.log('data', fetchAssets);
//         if (error) {
//           console.error('Error fetching assets:', error);
//           throw new Error(error.message);
//         }

//         dispatch(setAssets(data?.assets ?? []));
//       } catch (error: any) {
//         console.error('Error fetching assets:', error);
//         dispatch(setError(error.message || 'Failed to fetch assets.'));
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [dispatch, fetchAssets]
//   );
// }

export function useLoadAssets() {
  const client = useApolloClient();
  const dispatch = useAppDispatch();

  return useCallback(
    async (variables: { first?: number; skip?: number; orderBy?: string; orderDirection?: string }) => {
      dispatch(setLoading(true));
      try {
        const { data } = await client.query({
          query: AssetsQuery,
          variables: {
            first: variables.first || 25,
            skip: variables.skip || 2,
            orderBy: variables.orderBy || "id",
            orderDirection: variables.orderDirection || "asc",
          },
        });

        dispatch(setAssets(data?.assets ?? []));
      } catch (error: any) {
        console.error("Error fetching assets:", error);
        dispatch(setError(error.message || "Failed to fetch assets."));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [client, dispatch]
  );
}

/**
 * Hook to fetch transactions and dispatch to the store.
 */
export function useLoadTransactions(): (
  variables: { first?: number; skip?: number; orderBy?: string; orderDirection?: string }
) => Promise<void> {
  const dispatch = useAppDispatch();
  const fetchTransactions = useTransactionsQuery({
    vars: { first: 10, skip: 0, orderBy: 'id', orderDirection: 'asc' },
  });

  return useCallback(
    async (variables) => {
      dispatch(setLoading(true));
      try {
        const { data, error } = await fetchTransactions;

        if (error) {
          console.error('Error fetching transactions:', error);
          throw new Error(error.message);
        }

        dispatch(setTransactions(data?.transactions ?? []));
      } catch (error: any) {
        console.error('Error fetching transactions:', error);
        dispatch(setError(error.message || 'Failed to fetch transactions.'));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, fetchTransactions]
  );
}

// export function useLoadStakingInfo(): (chainId: SupportedChainId) => void {
//   const dispatch = useAppDispatch();

//   return useCallback(
//     (chainId: SupportedChainId) => {
//       dispatch(setLoading(true));
//       try {
//         const stakingInfo = useStakingInfo(chainId);
//         if (stakingInfo) {
//           dispatch(setStakingInfo(stakingInfo));
//         } else {
//           throw new Error('Staking information unavailable for the given chain ID.');
//         }
//       } catch (error: any) {
//         console.error('Error fetching staking info:', error);
//         dispatch(setError(error.message || 'Failed to fetch staking information.'));
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [dispatch]
//   );
// }