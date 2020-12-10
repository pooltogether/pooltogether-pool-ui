import axios from 'axios'

const COIN_GECKO_API_URL = 'https://api.coingecko.com/api/v3'

export const getCoinGeckoId = (token) => `${token.symbol.toLowerCase()} ${token.name.toLowerCase()}`

export const getCoinGeckoTokenList = async () => {
  const response = await axios.get(`${COIN_GECKO_API_URL}/coins/list`)
  console.log(response)
  return response
}

export const getCoinGeckoTokenData = async (tokenId) => {
  const response = await axios.get(`${COIN_GECKO_API_URL}/coins/${tokenId}`)
  console.log(response)
  return response
}