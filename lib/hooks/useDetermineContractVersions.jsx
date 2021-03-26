import React, { useState } from 'react'
import { batch, contract } from '@pooltogether/etherplex'
import { atom, useAtom } from 'jotai'
import { useEffect } from 'react'
import PrizePoolAbi from '@pooltogether/pooltogether-contracts/abis/PrizePool'
import FeatherIcon from 'feather-icons-react'

import { errorStateAtom } from 'lib/components/PoolData'
import {
  CONTRACTS,
  CONTRACT_VERSIONS,
  NETWORKS_TO_IGNORE_VERSION_CHECKS,
  PRIZE_POOL_TYPE,
  SUPPORTED_NETWORKS
} from 'lib/constants'
import { useNetwork } from 'lib/hooks/useNetwork'
import { poolAddressesAtom } from 'lib/hooks/usePoolAddresses'
import { useReadProvider } from 'lib/hooks/useReadProvider'
import { chainIdToName } from 'lib/utils/networks'

export const contractVersionsAtom = atom({})
export const prizePoolTypeAtom = atom((get) => {
  const contract = get(contractVersionsAtom)?.prizePool?.contract

  switch (contract) {
    case CONTRACTS.compound: {
      return PRIZE_POOL_TYPE.compound
    }
    case CONTRACTS.stake: {
      return PRIZE_POOL_TYPE.stake
    }
    case CONTRACTS.yield: {
      return PRIZE_POOL_TYPE.yield
    }
    default: {
      return null
    }
  }
})

export const useDetermineContractVersions = () => {
  const [errorState, setErrorState] = useAtom(errorStateAtom)
  const [contractVersions, setContractVersions] = useAtom(contractVersionsAtom)
  const { chainId } = useNetwork()
  const [poolAddresses] = useAtom(poolAddressesAtom)
  const { readProvider: provider, isLoaded: readProviderLoaded } = useReadProvider()
  const prizePoolAddress = poolAddresses.prizePool

  useEffect(() => {
    if (!readProviderLoaded) return
    setErrorState({})
    getContractVersions(provider, chainId, prizePoolAddress, setContractVersions, setErrorState)
  }, [readProviderLoaded, provider, chainId, prizePoolAddress])

  return null
}

/**
 * Sets the versions based on bytecode stored in current-pool-data.
 * Only checks Prize Pool & Prize Strategy.
 * @param {*} provider
 * @param {*} networkId
 * @param {*} prizePoolAddress
 * @param {*} setContractVersions
 * @param {*} setErrorState
 */
const getContractVersions = async (
  provider,
  networkId,
  prizePoolAddress,
  setContractVersions,
  setErrorState
) => {
  const prizePoolByteCode = await provider.getCode(prizePoolAddress)
  let prizePoolVersion = CONTRACT_VERSIONS[networkId]?.[prizePoolByteCode]

  const providerNetwork = await provider.getNetwork()

  if (providerNetwork.chainId !== networkId) {
    setContractVersions({})
    return
  }

  if (!prizePoolVersion) {
    setErrorState({
      error: true,
      view: <IncompatibleContract address={prizePoolAddress} />
    })
    // Set a fallback version
    prizePoolVersion = {
      contract: 'StakePrizePool',
      version: '3.2.0'
    }
  }

  const prizePoolContract = contract('prizePool', PrizePoolAbi, prizePoolAddress)
  const prizePoolValues = await batch(provider, prizePoolContract.prizeStrategy())
  const prizeStrategyAddress = prizePoolValues.prizePool.prizeStrategy[0]

  const prizeStrategyByteCode = await provider.getCode(prizeStrategyAddress)
  let prizeStrategyVersion = CONTRACT_VERSIONS[networkId]?.[prizeStrategyByteCode]

  if (!prizeStrategyVersion) {
    setErrorState({
      error: true,
      view: <IncompatibleContract address={prizeStrategyAddress} />
    })
    // Set a fallback version
    prizeStrategyVersion = {
      contract: 'MultipleWinners',
      version: '3.2.0'
    }
  }

  const contractVersions = {
    prizePool: prizePoolVersion,
    prizeStrategy: prizeStrategyVersion
  }

  setContractVersions(contractVersions)
}

const IncompatibleContract = (props) => {
  const { address } = props

  const [errorState, setErrorState] = useAtom(errorStateAtom)
  const [poolAddresses] = useAtom(poolAddressesAtom)
  const { chainId, name: networkName } = useNetwork()

  const [hideWarning, setHideWarning] = useState(false)
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  const { prizePool } = poolAddresses

  if (hideWarning) return null

  if (NETWORKS_TO_IGNORE_VERSION_CHECKS.includes(chainId)) return null

  return (
    <div className='text-left mb-10 border-2 border-primary rounded-lg px-7 py-4'>
      <div className='flex flex-row w-full relative'>
        <button
          className='absolute r-0'
          onClick={(e) => {
            e.preventDefault()
            setHideWarning(true)
          }}
        >
          <FeatherIcon
            icon='x'
            className='ml-auto w-6 h-6 my-auto text-accent-1 trans hover:text-inverse stroke-current'
          />
        </button>
        <div className='flex flex-col sm:flex-row text-orange-600'>
          <FeatherIcon icon='alert-triangle' className='w-10 h-10 my-auto stroke-current' />
          <div className='sm:ml-4'>
            <h4 className='mb-0'>Warning</h4>
            <p className='text-inverse text-sm my-0'>
              This version of the app may be incompatible with these contracts.
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={() => setShowMoreInfo(!showMoreInfo)}
        className='flex text-sm mt-2 text-accent-1'
      >
        {showMoreInfo ? 'Hide info' : 'More info'}
        <FeatherIcon
          icon={showMoreInfo ? 'chevron-up' : 'chevron-down'}
          className='ml-1 w-4 h-4 my-auto'
        />
      </button>

      {showMoreInfo && (
        <div className='mt-2'>
          <h6 className='break-all'>
            This version of the app may be incompatible with this contract '{address}' on{' '}
            {networkName}.
          </h6>
          <h6 className='mt-4'>
            Contract version identifiers may need to be added for new pooltogether-contracts
            versions in current-pool-data.
          </h6>
          <hr />
          <h5 className='text-accent-1'>Is {networkName} the correct network for this contract?</h5>
          Possibly try one of the following networks:
          <ul className='flex flex-col mt-2'>
            {SUPPORTED_NETWORKS.map((network) => {
              if (network === chainId || network === 31337 || network === 1234) return null
              const networkName = chainIdToName(network)
              return (
                <li className='ml-2' key={network}>
                  <a
                    className='text-green-1 trans hover:text-inverse'
                    href={`/pools/${networkName}/${prizePool}`}
                  >
                    {networkName}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
