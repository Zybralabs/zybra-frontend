
export const SEARCH_KEYS = {
  SORT_BY: 'sort-by',
  SORT: 'sort',
  ASSET_CLASS: 'asset-class',
  POOL_STATUS: 'pool-status',
  VALUE_LOCKED: 'value-locked',
  APR: 'apr',
} as const

export const poolFilterConfig = {
  assetClass: {
    label: 'Asset class',
    searchKey: SEARCH_KEYS.ASSET_CLASS,
  } as any,
  poolStatus: {
    label: 'Pool status',
    searchKey: SEARCH_KEYS.POOL_STATUS,
  } as any,
  valueLocked: {
    label: 'Value locked',
    searchKey: SEARCH_KEYS.VALUE_LOCKED,
  } as any,
  apr: {
    label: 'APR',
    searchKey: SEARCH_KEYS.APR,
  } as any,
}
