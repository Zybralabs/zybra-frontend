// import { useWeb3React } from '@web3-react/core'
// import { DEFAULT_LIST_OF_LISTS, UNSUPPORTED_LIST_URLS } from 'constants/lists'
// import ms from 'ms'
// import { useCallback, useEffect } from 'react'

// import { acceptListUpdate } from './actions'
// import useInterval from '@/lib/hooks/useInterval'
// import { useAllLists } from './hooks'
// import useIsWindowVisible from '@/lib/hooks/useIsWindowVisible'
// import { useAppDispatch } from '../hooks'
// export default function Updater(): null {
//   const { provider } = useWeb3React()
//   const dispatch = useAppDispatch()
//   const isWindowVisible = useIsWindowVisible()

//   // get all loaded lists, and the active urls
//   const lists = useAllLists()

//   const fetchList = useFetchListCallback()
//   const fetchAllListsCallback = useCallback(() => {
//     if (!isWindowVisible) return
//     DEFAULT_LIST_OF_LISTS.forEach((url) => {
//       // Skip validation on unsupported lists
//       const isUnsupportedList = UNSUPPORTED_LIST_URLS.includes(url)
//       fetchList(url, isUnsupportedList).catch((error) => console.debug('interval list fetching error', error))
//     })
//   }, [fetchList, isWindowVisible])

//   // fetch all lists every 10 minutes, but only after we initialize provider
//   useInterval(fetchAllListsCallback, provider ? ms("10m") : null)

//   // whenever a list is not loaded and not loading, try again to load it
//   useEffect(() => {
//     Object.keys(lists).forEach((listUrl) => {
//       const list = lists[listUrl]
//       if (!list.current && !list.loadingRequestId && !list.error) {
//         fetchList(listUrl).catch((error) => console.debug('list added fetching error', error))
//       }
//     })
//   }, [dispatch, fetchList, lists])

//   // if any lists from unsupported lists are loaded, check them too (in case new updates since last visit)
//   useEffect(() => {
//     UNSUPPORTED_LIST_URLS.forEach((listUrl) => {
//       const list = lists[listUrl]
//       if (!list || (!list.current && !list.loadingRequestId && !list.error)) {
//         fetchList(listUrl, /* isUnsupportedList= */ true).catch((error) =>
//           console.debug('list added fetching error', error)
//         )
//       }
//     })
//   }, [dispatch, fetchList, lists])

//   // automatically update lists if versions are minor/patch

//   return null
// }
