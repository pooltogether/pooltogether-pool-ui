import { useOnboard } from '@pooltogether/hooks'
import { getChain } from '@pooltogether/evm-chains-extended'

import { SUPPORTED_NETWORKS } from 'lib/constants'

export const useWalletNetwork = () => {
  const {
    isWalletConnected: walletConnected,
    network: walletChainId,
    walletName,
    wallet
  } = useOnboard()

  const walletOnUnsupportedNetwork = walletConnected && !SUPPORTED_NETWORKS.includes(walletChainId)

  let walletNetworkData = {}
  try {
    walletNetworkData = getChain(walletChainId)
  } catch (error) {}

  return {
    walletChainId,
    walletOnUnsupportedNetwork,
    walletConnected,
    walletName,
    walletNetworkShortName: walletNetworkData?.name || 'unknown network',
    walletNetwork: {
      ...walletNetworkData
    },
    wallet
  }
}
