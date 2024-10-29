import { memo, useCallback, useMemo } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  useCommonTokensOptionsWithFallback,
  useFavoriteTokensOptions,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useRecentlySearchedTokens,
} from 'uniswap/src/components/TokenSelector/hooks'
import {
  OnSelectCurrency,
  TokenOptionSection,
  TokenSection,
  TokenSectionsHookProps,
} from 'uniswap/src/components/TokenSelector/types'
import {
  isSwapListLoading,
  tokenOptionDifference,
  useTokenOptionsSection,
} from 'uniswap/src/components/TokenSelector/utils'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { isMobileApp } from 'utilities/src/platform'

function useTokenSectionsForSwapInput({
  activeAccountAddress,
  chainFilter,
}: TokenSectionsHookProps): GqlResult<TokenSection[]> {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()
  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter)

  const {
    data: popularTokenOptions,
    error: popularTokenOptionsError,
    refetch: refetchPopularTokenOptions,
    loading: popularTokenOptionsLoading,
    // if there is no chain filter then we show default chain tokens
  } = usePopularTokensOptions(activeAccountAddress, chainFilter ?? defaultChainId)

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptions(activeAccountAddress, chainFilter)

  const { data: commonTokenOptions } = useCommonTokensOptionsWithFallback(
    activeAccountAddress,
    chainFilter ?? defaultChainId,
  )

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!popularTokenOptions && popularTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError)

  const loading = portfolioTokenOptionsLoading || popularTokenOptionsLoading || favoriteTokenOptionsLoading

  const refetchAll = useCallback(() => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
  }, [refetchPopularTokenOptions, refetchPortfolioTokenOptions, refetchFavoriteTokenOptions])

  const isTestnet = chainFilter ? UNIVERSE_CHAIN_INFO[chainFilter].testnet : false

  const suggestedSection = useTokenOptionsSection(TokenOptionSection.SuggestedTokens, [
    (isTestnet ? commonTokenOptions : []) ?? [],
  ])
  const portfolioSection = useTokenOptionsSection(TokenOptionSection.YourTokens, portfolioTokenOptions)
  const recentSection = useTokenOptionsSection(TokenOptionSection.RecentTokens, recentlySearchedTokenOptions)
  const favoriteSection = useTokenOptionsSection(TokenOptionSection.FavoriteTokens, favoriteTokenOptions)
  const popularMinusPortfolioTokens = tokenOptionDifference(popularTokenOptions, portfolioTokenOptions)
  const popularSection = useTokenOptionsSection(TokenOptionSection.PopularTokens, popularMinusPortfolioTokens)

  const sections = useMemo(() => {
    if (isSwapListLoading(loading, portfolioSection, popularSection)) {
      return undefined
    }

    if (isTestnetModeEnabled) {
      return [...(suggestedSection ?? []), ...(portfolioSection ?? [])]
    }

    return [
      ...(suggestedSection ?? []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension & interface do not support favoriting but has a default list, so we can't rely on empty array check
      ...(isMobileApp ? favoriteSection ?? [] : []),
      ...(popularSection ?? []),
    ] satisfies TokenSection[]
  }, [
    suggestedSection,
    favoriteSection,
    loading,
    popularSection,
    portfolioSection,
    recentSection,
    isTestnetModeEnabled,
  ])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, sections],
  )
}

function _TokenSelectorSwapInputList({
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  isKeyboardOpen,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwapInput({
    activeAccountAddress,
    chainFilter,
  })
  // console.log(sections)
  //   const filtered = sections?.map((section) => {
  //     const filteredTokens = section.data.map((currency) => {
  //       if (!Array.isArray(currency)) {
  //         return allowedList.includes(currency.currencyInfo?.currency.symbol as string) ? currency : null
  //       }
  //       const res = currency.filter((predicate) =>
  //         allowedList.includes(predicate.currencyInfo?.currency.symbol as string) ? currency : null,
  //     )
  //     return res
  //   })
  //   return { ...section, data: filteredTokens.filter(Boolean) }
  // })
  const tokens = [
    {
      sectionKey: 'popularTokens',
      data: [
        {
          currencyInfo: {
            currency: {
              chainId: 137,
              decimals: 18,
              symbol: 'DAI',
              name: '(PoS) Dai Stablecoin',
              isNative: false,
              isToken: true,
              address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
            },
            currencyId: '137-0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/39787/large/dai.png?1724110678',
            safetyInfo: {
              tokenList: 'default',
              protectionResult: 'BENIGN',
            },
            safetyLevel: 'VERIFIED',
            isSpam: false,
          },
          balanceUSD: null,
          quantity: null,
        },
        {
          currencyInfo: {
            currency: {
              chainId: 137,
              decimals: 6,
              symbol: 'USDT',
              name: '(PoS) Tether USD',
              isNative: false,
              isToken: true,
              address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            },
            currencyId: '137-0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
            safetyInfo: {
              tokenList: 'default',
              protectionResult: 'BENIGN',
            },
            safetyLevel: 'VERIFIED',
            isSpam: false,
          },
          balanceUSD: null,
          quantity: null,
        },
        {
          currencyInfo: {
            currency: {
              chainId: 137,
              decimals: 8,
              symbol: 'WBTC',
              name: '(PoS) Wrapped BTC',
              isNative: false,
              isToken: true,
              address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
            },
            currencyId: '137-0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/39530/large/wbtc.png?1722809402',
            safetyInfo: {
              tokenList: 'default',
              protectionResult: 'BENIGN',
            },
            safetyLevel: 'VERIFIED',
            isSpam: false,
          },
          balanceUSD: null,
          quantity: null,
        },
        {
          currencyInfo: {
            currency: {
              chainId: 137,
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
              isNative: false,
              isToken: true,
              address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            },
            currencyId: '137-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694',
            safetyInfo: {
              tokenList: 'default',
              protectionResult: 'BENIGN',
            },
            safetyLevel: 'VERIFIED',
            isSpam: false,
          },
          balanceUSD: null,
          quantity: null,
        },
      ],
    },
  ]

  return (
    <TokenSelectorList
      chainFilter={chainFilter}
      hasError={Boolean(error)}
      isKeyboardOpen={isKeyboardOpen}
      loading={loading}
      refetch={refetch}
      //@ts-ignore
      sections={tokens}
      showTokenWarnings={true}
      onSelectCurrency={(...value) => {
        onSelectCurrency(...value)
      }}
    />
  )
}

export const TokenSelectorSwapInputList = memo(_TokenSelectorSwapInputList)
