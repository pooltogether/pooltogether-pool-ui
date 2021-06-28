import React from 'react'
import { getChain } from '@pooltogether/evm-chains-extended'
import { isValidAddress } from '@pooltogether/utilities'

import { PoolTogetherLoading } from 'lib/components/PoolTogetherLoading'
import { IncompatibleContractWarning } from 'lib/components/IncompatibleContractWarning'
import { IndexContent } from 'lib/components/IndexContent'
import { UnsupportedNetwork } from 'lib/components/UnsupportedNetwork'
import { usePoolChainValues } from 'lib/hooks/usePoolChainValues'
import { useNetwork } from 'lib/hooks/useNetwork'
import { useWalletNetwork } from 'lib/hooks/useWalletNetwork'
import { usePrizePoolContracts } from 'lib/hooks/usePrizePoolContracts'
import { useExternalErc20Awards } from 'lib/hooks/useExternalErc20Awards'
import { useExternalErc721Awards } from 'lib/hooks/useExternalErc721Awards'
import { useUserChainValues } from 'lib/hooks/useUserChainValues'
import { useUsersAddress } from '@pooltogether/hooks'
import { usePrizePoolAddress } from 'lib/hooks/usePrizePoolAddress'

// http://localhost:3000/pools/rinkeby/0xd1E58Db0d67DB3f28fFa412Db58aCeafA0fEF8fA#admin

export const getDataFetchingErrorMessage = (address, type, message) =>
  `Error fetching ${type} for prize pool with address: ${address}: ${message}. (maybe wrong Ethereum network or your IP is being rate-limited?)`

/**
 * Wraps app and populates Jotai pool data stores if applicable
 */
export const PoolData = (props) => {
  const { chainId } = useNetwork()
  const { walletOnUnsupportedNetwork, walletName, wallet } = useWalletNetwork()

  const usersAddress = useUsersAddress()

  const prizePoolAddress = usePrizePoolAddress()
  const { isFetched: prizePoolContractsIsFetched, data: prizePoolContracts } =
    usePrizePoolContracts()
  const { isFetched: poolChainValuesIsFetched } = usePoolChainValues()
  const { isFetched: usersChainValuesIsFetched } = useUserChainValues()
  const { isFetched: externalErc20AwardsIsFetched } = useExternalErc20Awards()
  const { isFetched: externalErc721AwardsIsFetched } = useExternalErc721Awards()

  let walletOnUnsupportedNetworkOverride = true
  if (walletName === 'WalletConnect') {
    if (chainId === 56) {
      wallet.provider.chainId = chainId
      wallet.provider.networkId = chainId
      wallet.provider.rpcUrl = 'https://bsc-dataseed.binance.org/'
      wallet.provider.rpc = {
        56: 'https://bsc-dataseed.binance.org/'
      }
      walletOnUnsupportedNetworkOverride = false
    }
  }
  if (walletOnUnsupportedNetwork && walletOnUnsupportedNetworkOverride) {
    return <UnsupportedNetwork />
  }

  if (
    prizePoolAddress !== undefined &&
    (!isValidAddress(prizePoolAddress) || prizePoolContracts?.invalidPrizePoolAddress)
  ) {
    return <InvalidAddress invalidAddress={prizePoolAddress} chainId={chainId} />
  }

  const loading =
    !poolChainValuesIsFetched ||
    !prizePoolContractsIsFetched ||
    !externalErc20AwardsIsFetched ||
    !externalErc721AwardsIsFetched ||
    (usersAddress && !usersChainValuesIsFetched)

  if (loading) {
    return <PoolTogetherLoading />
  }

  return (
    <>
      {/* <IncompatibleContractWarning /> */}
      {props.children}
    </>
  )
}

const InvalidAddress = (props) => {
  const { invalidAddress, chainId } = props
  const networkView = getChain(chainId)?.name

  return (
    <>
      <div className='border-2 border-primary px-7 py-4 rounded-xl mb-10 text-accent-1'>
        <h1>⚠️ Invalid address</h1>
        <p>
          <b>{invalidAddress}</b> is not a valid prize pool address on <b>{networkView}</b>.
        </p>
        <p>Possibly wrong network?</p>
      </div>
      <h2 className='mb-4 text-accent-1'>{networkView} Prize Pools</h2>
      <IndexContent />
    </>
  )
}
