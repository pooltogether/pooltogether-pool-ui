import { useQuery } from 'react-query'
import { ethers } from 'ethers'

import { contractAddresses } from '@pooltogether/current-pool-data'
import PoolWithMultipleWinnersBuilderAbi from '@pooltogether/pooltogether-contracts/abis/PoolWithMultipleWinnersBuilder'

import {
  NETWORKS_WITHOUT_LOGS,
  NO_REFETCH_QUERY_OPTIONS,
  POOL_WITH_MULTIPLE_WINNERS_BUILDERS,
  PRIZE_POOL_TYPE,
  QUERY_KEYS
} from 'lib/constants'
import { useNetwork } from 'lib/hooks/useNetwork'
import { useReadProvider } from '@pooltogether/hooks'

// If logs aren't supported, we can add the full list here
const PRIZE_POOL_LIST_FALLBACK = Object.freeze({
  137: [
    {
      type: PRIZE_POOL_TYPE.yield,
      prizePool: '0x887E17D791Dcb44BfdDa3023D26F7a04Ca9C7EF4',
      prizeStrategy: '0x5A65f0CE666B8334b6481A8d8C8323BB782386e6'
    },
    {
      type: PRIZE_POOL_TYPE.stake,
      prizePool: '0x60764c6be24ddab70d9ae1dbf7436533cc073c21',
      prizeStrategy: '0x07591c981e86dd361101ab088f0f21e9d5b371ab'
    },
    {
      type: PRIZE_POOL_TYPE.yield,
      prizePool: '0x9e299cf900a81b55024398ff2cdb1c9c0fcec902',
      prizeStrategy: '0xa0f8fc9a5cf40f0eacd207986c8c836750011446'
    },
    {
      type: PRIZE_POOL_TYPE.yield,
      prizePool: '0xef1ba9f254b02d4886c909537f11a3104efaab1f',
      prizeStrategy: '0xd142642b2620c6217efffd8c463f068d549a875b'
    },
    {
      type: PRIZE_POOL_TYPE.yield,
      prizePool: '0x345dc966180d5cf6b57a476362e9c859b725991e',
      prizeStrategy: '0x6721ade2d0e1fa640953f850ca931c456a2c45ef'
    }
  ]
})

export const useAllCreatedPrizePools = () => {
  const { chainId } = useNetwork()
  const { readProvider, isReadProviderReady } = useReadProvider(chainId)

  return useQuery(
    [QUERY_KEYS.useAllCreatedPrizePools, chainId],
    async () => await getAllCreatedPrizePools(readProvider, chainId),
    // @ts-ignore
    {
      ...NO_REFETCH_QUERY_OPTIONS,
      enabled: chainId && isReadProviderReady,
      staleTime: Infinity
    }
  )
}

const getAllCreatedPrizePools = async (provider, chainId) => {
  try {
    const poolWithMultipleWinnersBuilders = POOL_WITH_MULTIPLE_WINNERS_BUILDERS[chainId]

    if (NETWORKS_WITHOUT_LOGS.includes(chainId)) {
      return PRIZE_POOL_LIST_FALLBACK[chainId]
    }

    const prizePools = []
    for (const builder of poolWithMultipleWinnersBuilders) {
      const { address, blockNumber } = builder
      const builderContract = new ethers.Contract(
        address,
        PoolWithMultipleWinnersBuilderAbi,
        provider
      )

      // NOTE: Dependant on there only being "pool created" events
      let builderLogs = []

      // TODO: Maticvigil only supports logs for 1000 blocks at a time
      if (![80001, 137].includes(chainId)) {
        builderLogs = await provider.getLogs({
          address,
          fromBlock: blockNumber
        })
      }

      builderLogs.forEach((log) => {
        const parsedLog = builderContract.interface.parseLog(log)

        prizePools.push({
          type: getPrizePoolType(parsedLog.name),
          prizePool: parsedLog.args.prizePool,
          prizeStrategy: parsedLog.args.prizeStrategy
        })
      })
    }

    // Dai pool was made with a different build process
    if (chainId === 1) {
      prizePools.push({
        type: 'Compound',
        prizePool: contractAddresses[1].dai.prizePool,
        prizeStrategy: contractAddresses[1].dai.prizeStrategy
      })
    }

    return prizePools
  } catch (e) {
    console.error(e.message)
    return []
  }
}

const getPrizePoolType = (eventName) => {
  switch (eventName) {
    case 'CompoundPrizePoolWithMultipleWinnersCreated':
      return 'Compound'
    case 'StakePrizePoolWithMultipleWinnersCreated':
      return 'Stake'
    case 'YieldSourcePrizePoolWithMultipleWinnersCreated':
      return 'Yield'
    default:
      return ''
  }
}
