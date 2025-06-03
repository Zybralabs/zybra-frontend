import type { Pool } from '@centrifuge/centrifuge-js'
import { Dec } from './Decimal'

export function getPoolValueLocked(pool: Pool) {
  return pool.tranches
    .map((tranche) =>
      tranche.tokenPrice ? tranche.totalIssuance.toDecimal().mul(tranche.tokenPrice.toDecimal()) : Dec(0)
    )
    .reduce((a, b) => a.add(b))
}
