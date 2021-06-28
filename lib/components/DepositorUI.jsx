import React from 'react'

import { AwardPrizeCard } from 'lib/components/AwardPrizeCard'
import { Card } from 'lib/components/Card'
import { Collapse } from 'lib/components/Collapse'
import { DepositUI } from 'lib/components/DepositUI'
import { PrizeCard } from 'lib/components/PrizeCard'
import { WithdrawUI } from 'lib/components/WithdrawUI'
import { RelativeInternalLink } from 'lib/components/RelativeInternalLink'
import { PoolDepositorStatsCard } from 'lib/components/PoolStats'
import { useTimeLeftBeforePrize } from 'lib/hooks/useTimeLeftBeforePrize'

export const DepositorUI = (props) => {
  const { timeRemaining } = useTimeLeftBeforePrize()

  return (
    <>
      <PrizeCard className='mb-4' />
      {!timeRemaining && <AwardPrizeCard />}
      <Card>
        <Collapse title='Deposit to win' openOnMount>
          <DepositUI />
        </Collapse>
      </Card>
      <PoolDepositorStatsCard />
      <Card>
        <Collapse title='Withdraw'>
          <WithdrawUI />
        </Collapse>
      </Card>

      <div className='flex justify-between w-3/4 sm:w-1/2 mx-auto'>
        <RelativeInternalLink link='/manage'>View Pool Details</RelativeInternalLink>
        <RelativeInternalLink link='/admin'>Manage Pool</RelativeInternalLink>
      </div>
    </>
  )
}
