import type { Pool } from '@centrifuge/centrifuge-js'

export function getPoolTVL(pool: Pool) {
  return pool.nav.aum.toFloat() + pool.reserve.total.toFloat()
}
