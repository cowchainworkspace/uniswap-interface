import { useMemo } from 'react'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId } from 'uniswap/src/utils/currencyId'

const tokens = {
  '137-0xc2132d05d31c914a87c6611c10748aeb04b58e8f': {
    token: {
      __typename: 'Token',
      id: 'VG9rZW46UE9MWUdPTl8weGMyMTMyZDA1ZDMxYzkxNGE4N2M2NjExYzEwNzQ4YWViMDRiNThlOGY=',
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      chain: 'POLYGON',
      decimals: 6,
      name: '(PoS) Tether USD',
      standard: 'ERC20',
      symbol: 'USDT',
      project: {
        __typename: 'TokenProject',
        id: 'VG9rZW5Qcm9qZWN0OkVUSEVSRVVNXzB4ZGFjMTdmOTU4ZDJlZTUyM2EyMjA2MjA2OTk0NTk3YzEzZDgzMWVjN19Qb2x5Z29uIEJyaWRnZWQgVVNEVCAoUG9seWdvbik=',
        isSpam: false,
        logoUrl:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
        name: 'Polygon Bridged USDT (Polygon)',
        safetyLevel: 'VERIFIED',
      },
      feeData: {
        __typename: 'FeeData',
        buyFeeBps: null,
        sellFeeBps: null,
      },
      protectionInfo: {
        __typename: 'ProtectionInfo',
        result: 'BENIGN',
        attackTypes: [],
      },
    },
  },
  '137-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
    token: {
      __typename: 'Token',
      id: 'VG9rZW46UE9MWUdPTl8weDNjNDk5YzU0MmNlZjVlMzgxMWUxMTkyY2U3MGQ4Y2MwM2Q1YzMzNTk=',
      address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      chain: 'POLYGON',
      decimals: 6,
      name: 'USD Coin',
      standard: 'ERC20',
      symbol: 'USDC',
      project: {
        __typename: 'TokenProject',
        id: 'VG9rZW5Qcm9qZWN0OkVUSEVSRVVNXzB4YTBiODY5OTFjNjIxOGIzNmMxZDE5ZDRhMmU5ZWIwY2UzNjA2ZWI0OF9VU0RD',
        isSpam: false,
        logoUrl: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
        name: 'USDC',
        safetyLevel: 'VERIFIED',
      },
      feeData: {
        __typename: 'FeeData',
        buyFeeBps: null,
        sellFeeBps: null,
      },
      protectionInfo: {
        __typename: 'ProtectionInfo',
        result: 'BENIGN',
        attackTypes: [],
      },
    },
  },
}

export function useCurrencyInfo(_currencyId?: string): Maybe<CurrencyInfo> {
  // const { data } = useTokenQuery({
  //   variables: currencyIdToContractInput(_currencyId ?? ''),
  //   skip: !_currencyId || options?.skip,
  //   fetchPolicy: options?.refetch ? 'cache-and-network' : 'cache-first',
  // })

  //@ts-expect-error: error
  const data = tokens[_currencyId?.toLowerCase() || '1']

  return useMemo(() => {
    if (!data?.token || !_currencyId) {
      return undefined
    }

    return gqlTokenToCurrencyInfo(data.token)
  }, [data, _currencyId])
}

export function useNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
