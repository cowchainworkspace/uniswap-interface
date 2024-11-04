import { memo, useCallback, useMemo, useRef } from 'react'
import { Flex } from 'ui/src'
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
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { GqlResult } from 'uniswap/src/data/types'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isMobileApp } from 'utilities/src/platform'

// eslint-disable-next-line complexity
function useTokenSectionsForSwapOutput({
  activeAccountAddress,
  chainFilter,
  input,
}: TokenSectionsHookProps): GqlResult<TokenSection[]> {
  const isBridgingEnabled = useFeatureFlag(FeatureFlags.Bridging)
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
    // if there is no chain filter then we show mainnet tokens
  } = usePopularTokensOptions(activeAccountAddress, chainFilter ?? defaultChainId)

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptions(activeAccountAddress, chainFilter)

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter then we show default chain tokens
  } = useCommonTokensOptionsWithFallback(activeAccountAddress, chainFilter ?? defaultChainId)

  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
    shouldNest: shouldNestBridgingTokens,
  } = useBridgingTokensOptions({ input, walletAddress: activeAccountAddress, chainFilter })

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!popularTokenOptions && popularTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError) ||
    (!bridgingTokenOptions && bridgingTokenOptionsError)

  const loading =
    (!portfolioTokenOptions && portfolioTokenOptionsLoading) ||
    (!popularTokenOptions && popularTokenOptionsLoading) ||
    (!favoriteTokenOptions && favoriteTokenOptionsLoading) ||
    (!commonTokenOptions && commonTokenOptionsLoading) ||
    (!bridgingTokenOptions && bridgingTokenOptionsLoading)

  const refetchAllRef = useRef<() => void>(() => {})

  refetchAllRef.current = (): void => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
    refetchCommonTokenOptions?.()
    refetchBridgingTokenOptions?.()
  }

  const refetch = useCallback(() => {
    refetchAllRef.current()
  }, [])

  const newTag = useMemo(
    () =>
      isMobileApp ? (
        // Hack for vertically centering the new tag with text
        <Flex row pt={1}>
          <NewTag />
        </Flex>
      ) : (
        <NewTag />
      ),
    [],
  )

  // we draw the Suggested pills as a single item of a section list, so `data` is TokenOption[][]

  const suggestedSectionOptions = useMemo(() => [commonTokenOptions ?? []], [commonTokenOptions])
  const suggestedSection = useTokenOptionsSection(TokenOptionSection.SuggestedTokens, suggestedSectionOptions)

  const portfolioSection = useTokenOptionsSection(TokenOptionSection.YourTokens, portfolioTokenOptions)
  const recentSection = useTokenOptionsSection(TokenOptionSection.RecentTokens, recentlySearchedTokenOptions)
  const favoriteSection = useTokenOptionsSection(TokenOptionSection.FavoriteTokens, favoriteTokenOptions)

  const popularMinusPortfolioTokens = useMemo(
    () => tokenOptionDifference(popularTokenOptions, portfolioTokenOptions),
    [popularTokenOptions, portfolioTokenOptions],
  )
  const popularSection = useTokenOptionsSection(TokenOptionSection.PopularTokens, popularMinusPortfolioTokens)

  const bridgingSectionTokenOptions = useMemo(
    () => (shouldNestBridgingTokens ? [bridgingTokenOptions ?? []] : bridgingTokenOptions ?? []),
    [bridgingTokenOptions, shouldNestBridgingTokens],
  )
  const bridgingSection = useTokenOptionsSection(TokenOptionSection.BridgingTokens, bridgingSectionTokenOptions, newTag)

  const sections = useMemo(() => {
    if (isSwapListLoading(loading, portfolioSection, popularSection)) {
      return undefined
    }

    if (isTestnetModeEnabled) {
      return [...(suggestedSection ?? []), ...(portfolioSection ?? [])]
    }

    return [
      ...(suggestedSection ?? []),
      ...(isBridgingEnabled ? bridgingSection ?? [] : []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension & interface do not support favoriting but has a default list, so we can't rely on empty array check
      ...(isMobileApp ? favoriteSection ?? [] : []),
      ...(popularSection ?? []),
    ]
  }, [
    loading,
    portfolioSection,
    popularSection,
    suggestedSection,
    isBridgingEnabled,
    bridgingSection,
    recentSection,
    favoriteSection,
    isTestnetModeEnabled,
  ])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch,
    }),
    [error, loading, refetch, sections],
  )
}

function _TokenSelectorSwapOutputList({
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  isKeyboardOpen,
  input,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwapOutput({
    activeAccountAddress,
    chainFilter,
    input,
  })

  // const filtered = sections?.map((section) => {
  //   const filteredTokens = section.data.map((currency) => {
  //     if (!Array.isArray(currency)) {
  //       return allowedList.includes(currency.currencyInfo?.currency.symbol as string) ? currency : null
  //     }
  //     const res = currency.filter((predicate) =>
  //       allowedList.includes(predicate.currencyInfo?.currency.symbol as string) ? currency : null,
  //     )
  //     return res
  //   })
  //   return { ...section, data: filteredTokens.filter(Boolean) }
  // })

  const tokens = [
    {
      sectionKey: 'suggestedTokens',
      data: [
        [
          {
            currencyInfo: {
              currency: {
                chainId: 137,
                decimals: 18,
                name: 'Polygon POL',
                symbol: 'POL',
                isNative: true,
                isToken: false,
                address: '0x0000000000000000000000000000000000001010',
              },
              currencyId: '137-0x0000000000000000000000000000000000001010',
              logoUrl: 'https://coin-images.coingecko.com/coins/images/32440/large/polygon.png?1698233684',
              safetyLevel: 'VERIFIED',
              safetyInfo: {
                tokenList: 'default',
                protectionResult: 'UNKNOWN',
              },
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
              safetyLevel: 'VERIFIED',
              safetyInfo: {
                tokenList: 'default',
                protectionResult: 'UNKNOWN',
              },
            },
            balanceUSD: null,
            quantity: null,
          },
          {
            currencyInfo: {
              currency: {
                chainId: 137,
                decimals: 18,
                symbol: 'WETH',
                name: 'Wrapped Ether',
                isNative: false,
                isToken: true,
                address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
              },
              currencyId: '137-0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
              logoUrl:
                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
              safetyLevel: 'VERIFIED',
              safetyInfo: {
                tokenList: 'default',
                protectionResult: 'UNKNOWN',
              },
            },
            balanceUSD: null,
            quantity: null,
          },
        ],
      ],
    },
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
              decimals: 18,
              symbol: '1INCH',
              name: '1inch',
              isNative: false,
              isToken: true,
              address: '0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f',
            },
            currencyId: '137-0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/13469/large/1inch-token.png?1696513230',
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
              decimals: 18,
              symbol: 'AAVE',
              name: 'Aave (PoS)',
              isNative: false,
              isToken: true,
              address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b',
            },
            currencyId: '137-0xd6df932a45c0f255f85145f286ea0b292b21c90b',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/12645/large/aave-token-round.png?1720472354',
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
              decimals: 18,
              symbol: 'GHST',
              name: 'Aavegotchi',
              isNative: false,
              isToken: true,
              address: '0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7',
            },
            currencyId: '137-0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/12467/large/GHST.png?1696512286',
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
              decimals: 18,
              symbol: 'AGLD',
              name: 'Adventure Gold',
              isNative: false,
              isToken: true,
              address: '0x6a6bd53d677f8632631662c48bd47b1d4d6524ee',
            },
            currencyId: '137-0x6a6bd53d677f8632631662c48bd47b1d4d6524ee',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x32353A6C91143bfd6C7d363B546e62a9A2489A20/logo.png',
            safetyInfo: {
              tokenList: 'default',
              attackType: 'other',
              protectionResult: 'SPAM',
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
              decimals: 18,
              symbol: 'agEUR',
              name: 'agEUR',
              isNative: false,
              isToken: true,
              address: '0xe0b52e49357fd4daf2c15e02058dce6bc0057db4',
            },
            currencyId: '137-0xe0b52e49357fd4daf2c15e02058dce6bc0057db4',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/19479/large/agEUR-4.png?1710726218',
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
              decimals: 18,
              symbol: 'ALI',
              name: 'Alethea Artificial Liquid Intelligence',
              isNative: false,
              isToken: true,
              address: '0xbfc70507384047aa74c29cdc8c5cb88d0f7213ac',
            },
            currencyId: '137-0xbfc70507384047aa74c29cdc8c5cb88d0f7213ac',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/22062/large/ALI-v2.webp?1728501978',
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
              decimals: 18,
              symbol: 'ANKR',
              name: 'Ankr',
              isNative: false,
              isToken: true,
              address: '0x101a023270368c0d50bffb62780f4afd4ea79c35',
            },
            currencyId: '137-0x101a023270368c0d50bffb62780f4afd4ea79c35',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/4324/large/U85xTl2.png?1696504928',
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
              decimals: 18,
              symbol: 'APE',
              name: 'ApeCoin',
              isNative: false,
              isToken: true,
              address: '0xb7b31a6bc18e48888545ce79e83e06003be70930',
            },
            currencyId: '137-0xb7b31a6bc18e48888545ce79e83e06003be70930',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/24383/large/apecoin.jpg?1696523566',
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
              decimals: 18,
              symbol: 'ARPA',
              name: 'ARPA Chain',
              isNative: false,
              isToken: true,
              address: '0xee800b277a96b0f490a1a732e1d6395fad960a26',
            },
            currencyId: '137-0xee800b277a96b0f490a1a732e1d6395fad960a26',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/8506/large/9u0a23XY_400x400.jpg?1696508685',
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
              symbol: 'AXL',
              name: 'Axelar',
              isNative: false,
              isToken: true,
              address: '0x6e4e624106cb12e168e6533f8ec7c82263358940',
            },
            currencyId: '137-0x6e4e624106cb12e168e6533f8ec7c82263358940',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/27277/large/V-65_xQ1_400x400.jpeg?1696526329',
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
              decimals: 18,
              symbol: 'BAL',
              name: 'Balancer',
              isNative: false,
              isToken: true,
              address: '0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3',
            },
            currencyId: '137-0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/11683/large/Balancer.png?1696511572',
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
              decimals: 18,
              symbol: 'BAT',
              name: 'Basic Attention Token',
              isNative: false,
              isToken: true,
              address: '0x3cef98bb43d732e2f285ee605a8158cde967d219',
            },
            currencyId: '137-0x3cef98bb43d732e2f285ee605a8158cde967d219',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/677/large/basic-attention-token.png?1696501867',
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
              decimals: 18,
              symbol: 'BICO',
              name: 'Biconomy',
              isNative: false,
              isToken: true,
              address: '0x91c89a94567980f0e9723b487b0bed586ee96aa7',
            },
            currencyId: '137-0x91c89a94567980f0e9723b487b0bed586ee96aa7',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xF17e65822b568B3903685a7c9F496CF7656Cc6C2/logo.png',
            safetyInfo: {
              tokenList: 'default',
              attackType: 'other',
              protectionResult: 'SPAM',
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
              decimals: 18,
              symbol: 'BUSD',
              name: 'Binance USD',
              isNative: false,
              isToken: true,
              address: '0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7',
            },
            currencyId: '137-0xdab529f40e671a1d4bf91361c21bf9f0c9712ab7',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4Fabb145d64652a948d72533023f6E7A623C7C53/logo.png',
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
              symbol: 'USDC.e',
              name: 'Bridged USDC',
              isNative: false,
              isToken: true,
              address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            },
            currencyId: '137-0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/33000/large/usdc.png?1700119918',
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
              decimals: 18,
              symbol: 'LINK',
              name: 'ChainLink Token',
              isNative: false,
              isToken: true,
              address: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39',
            },
            currencyId: '137-0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1696502009',
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
              decimals: 18,
              symbol: 'COMP',
              name: 'Compound',
              isNative: false,
              isToken: true,
              address: '0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c',
            },
            currencyId: '137-0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/10775/large/COMP.png?1696510737',
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
              symbol: 'CRO',
              name: 'Cronos',
              isNative: false,
              isToken: true,
              address: '0xada58df0f643d959c2a47c9d4d4c1a4defe3f11c',
            },
            currencyId: '137-0xada58df0f643d959c2a47c9d4d4c1a4defe3f11c',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b/logo.png',
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
              decimals: 18,
              symbol: 'CRV',
              name: 'CRV (PoS)',
              isNative: false,
              isToken: true,
              address: '0x172370d5cd63279efa6d502dab29171933a610af',
            },
            currencyId: '137-0x172370d5cd63279efa6d502dab29171933a610af',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/12124/large/Curve.png?1696511967',
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
              decimals: 18,
              symbol: 'ELON',
              name: 'Dogelon Mars',
              isNative: false,
              isToken: true,
              address: '0xe0339c80ffde91f3e20494df88d4206d86024cdf',
            },
            currencyId: '137-0xe0339c80ffde91f3e20494df88d4206d86024cdf',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/14962/large/6GxcPRo3_400x400.jpg?1696514622',
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
              decimals: 18,
              symbol: 'DYDX',
              name: 'dYdX',
              isNative: false,
              isToken: true,
              address: '0x4c3bf0a3de9524af68327d1d2558a3b70d17d42a',
            },
            currencyId: '137-0x4c3bf0a3de9524af68327d1d2558a3b70d17d42a',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x92D6C1e31e14520e676a687F0a93788B716BEff5/logo.png',
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
              decimals: 18,
              symbol: 'FET',
              name: 'Fetch ai',
              isNative: false,
              isToken: true,
              address: '0x7583feddbcefa813dc18259940f76a02710a8905',
            },
            currencyId: '137-0x7583feddbcefa813dc18259940f76a02710a8905',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85/logo.png',
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
              decimals: 18,
              symbol: 'FORT',
              name: 'Forta',
              isNative: false,
              isToken: true,
              address: '0x9ff62d1fc52a907b6dcba8077c2ddca6e6a9d3e1',
            },
            currencyId: '137-0x9ff62d1fc52a907b6dcba8077c2ddca6e6a9d3e1',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/25060/large/Forta_lgo_%281%29.png?1696524210',
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
              decimals: 18,
              symbol: 'FRAX',
              name: 'Frax',
              isNative: false,
              isToken: true,
              address: '0x45c32fa6df82ead1e2ef74d17b76547eddfaff89',
            },
            currencyId: '137-0x45c32fa6df82ead1e2ef74d17b76547eddfaff89',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/13422/large/FRAX_icon.png?1696513182',
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
              decimals: 18,
              symbol: 'FXS',
              name: 'Frax Share',
              isNative: false,
              isToken: true,
              address: '0x1a3acf6d19267e2d3e7f898f42803e90c9219062',
            },
            currencyId: '137-0x1a3acf6d19267e2d3e7f898f42803e90c9219062',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/13423/large/Frax_Shares_icon.png?1696513183',
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
              decimals: 18,
              symbol: 'GLM',
              name: 'Golem Network Token (PoS)',
              isNative: false,
              isToken: true,
              address: '0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf',
            },
            currencyId: '137-0x0b220b82f3ea3b7f6d9a1d8ab58930c064a2b5bf',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429/logo.png',
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
              decimals: 18,
              symbol: 'GRT',
              name: 'Graph Token (PoS)',
              isNative: false,
              isToken: true,
              address: '0x5fe2b58c013d7601147dcdd68c143a77499f5531',
            },
            currencyId: '137-0x5fe2b58c013d7601147dcdd68c143a77499f5531',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/13397/large/Graph_Token.png?1696513159',
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
              decimals: 18,
              symbol: 'IOTX',
              name: 'IoTeX Network (PoS)',
              isNative: false,
              isToken: true,
              address: '0xf6372cdb9c1d3674e83842e3800f2a62ac9f3c66',
            },
            currencyId: '137-0xf6372cdb9c1d3674e83842e3800f2a62ac9f3c66',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6fB3e0A217407EFFf7Ca062D46c26E5d60a14d69/logo.png',
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
              decimals: 18,
              symbol: 'JASMY',
              name: 'JasmyCoin',
              isNative: false,
              isToken: true,
              address: '0xb87f5c1e81077ffcfe821da240fd20c99c533af1',
            },
            currencyId: '137-0xb87f5c1e81077ffcfe821da240fd20c99c533af1',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7420B4b9a0110cdC71fB720908340C03F9Bc03EC/logo.png',
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
              decimals: 18,
              symbol: 'ZRO',
              name: 'LayerZero',
              isNative: false,
              isToken: true,
              address: '0x6985884c4392d348587b19cb9eaaf157f13271cd',
            },
            currencyId: '137-0x6985884c4392d348587b19cb9eaaf157f13271cd',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/28206/large/ftxG9_TJ_400x400.jpeg?1696527208',
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
              decimals: 18,
              symbol: 'LDO',
              name: 'Lido DAO Token (PoS)',
              isNative: false,
              isToken: true,
              address: '0xc3c7d422809852031b44ab29eec9f1eff2a58756',
            },
            currencyId: '137-0xc3c7d422809852031b44ab29eec9f1eff2a58756',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/13573/large/Lido_DAO.png?1696513326',
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
              decimals: 18,
              symbol: 'MKR',
              name: 'Maker',
              isNative: false,
              isToken: true,
              address: '0x6f7c932e7684666c9fd1d44527765433e01ff61d',
            },
            currencyId: '137-0x6f7c932e7684666c9fd1d44527765433e01ff61d',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/1364/large/Mark_Maker.png?1696502423',
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
              decimals: 18,
              symbol: 'MASK',
              name: 'Mask Network',
              isNative: false,
              isToken: true,
              address: '0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7',
            },
            currencyId: '137-0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/14051/large/Mask_Network.jpg?1696513776',
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
              decimals: 18,
              symbol: 'PAXG',
              name: 'Paxos Gold (PoS)',
              isNative: false,
              isToken: true,
              address: '0x553d3d295e0f695b9228246232edf400ed3560b5',
            },
            currencyId: '137-0x553d3d295e0f695b9228246232edf400ed3560b5',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x45804880De22913dAFE09f4980848ECE6EcbAf78/logo.png',
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
              decimals: 18,
              symbol: 'QUICK',
              name: 'Quickswap',
              isNative: false,
              isToken: true,
              address: '0x831753dd7087cac61ab5644b308642cc1c33dc13',
            },
            currencyId: '137-0x831753dd7087cac61ab5644b308642cc1c33dc13',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/13970/large/quick.png?1696513704',
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
              decimals: 18,
              symbol: 'RAI',
              name: 'Rai Reflex Index (PoS)',
              isNative: false,
              isToken: true,
              address: '0x00e5646f60ac6fb446f621d146b6e1886f002905',
            },
            currencyId: '137-0x00e5646f60ac6fb446f621d146b6e1886f002905',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/14004/large/RAI-logo-coin.png?1696513733',
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
              decimals: 18,
              symbol: 'MANA',
              name: '(PoS) Decentraland MANA',
              isNative: false,
              isToken: true,
              address: '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4',
            },
            currencyId: '137-0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/878/large/decentraland-mana.png?1696502010',
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
              decimals: 18,
              symbol: 'RNDR',
              name: 'Render Token',
              isNative: false,
              isToken: true,
              address: '0x61299774020da444af134c82fa83e3810b309991',
            },
            currencyId: '137-0x61299774020da444af134c82fa83e3810b309991',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/11636/large/rndr.png?1696511529',
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
              decimals: 18,
              symbol: 'SAND',
              name: 'SAND',
              isNative: false,
              isToken: true,
              address: '0xbbba073c31bf03b8acf7c28ef0738decf3695683',
            },
            currencyId: '137-0xbbba073c31bf03b8acf7c28ef0738decf3695683',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/12129/large/sandbox_logo.jpg?1696511971',
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
              decimals: 18,
              symbol: 'FOX',
              name: 'ShapeShift FOX Token',
              isNative: false,
              isToken: true,
              address: '0x65a05db8322701724c197af82c9cae41195b0aa8',
            },
            currencyId: '137-0x65a05db8322701724c197af82c9cae41195b0aa8',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/9988/large/fox_token.png?1728373561',
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
              decimals: 18,
              symbol: 'SHIB',
              name: 'SHIBA INU (PoS)',
              isNative: false,
              isToken: true,
              address: '0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec',
            },
            currencyId: '137-0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec',
            logoUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
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
              decimals: 18,
              symbol: 'SD',
              name: 'Stader',
              isNative: false,
              isToken: true,
              address: '0x1d734a02ef1e1f5886e66b0673b71af5b53ffa94',
            },
            currencyId: '137-0x1d734a02ef1e1f5886e66b0673b71af5b53ffa94',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/20658/large/SD_Token_Logo.png?1696520060',
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
              decimals: 18,
              symbol: 'STG',
              name: 'StargateToken',
              isNative: false,
              isToken: true,
              address: '0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590',
            },
            currencyId: '137-0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/24413/large/STG_LOGO.png?1696523595',
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
              decimals: 18,
              symbol: 'SUSHI',
              name: 'Sushi',
              isNative: false,
              isToken: true,
              address: '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a',
            },
            currencyId: '137-0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png?1696512101',
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
              decimals: 18,
              symbol: 'SYN',
              name: 'Synapse',
              isNative: false,
              isToken: true,
              address: '0xf8f9efc0db77d8881500bb06ff5d6abc3070e695',
            },
            currencyId: '137-0xf8f9efc0db77d8881500bb06ff5d6abc3070e695',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/18024/large/synapse_social_icon.png?1696517540',
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
              decimals: 18,
              symbol: 'SNX',
              name: 'Synthetix Network Token (PoS)',
              isNative: false,
              isToken: true,
              address: '0x50b728d8d964fd00c2d0aad81718b71311fef68a',
            },
            currencyId: '137-0x50b728d8d964fd00c2d0aad81718b71311fef68a',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/3406/large/SNX.png?1696504103',
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
              decimals: 18,
              symbol: 'TBTC',
              name: 'tBTC',
              isNative: false,
              isToken: true,
              address: '0x236aa50979d5f3de3bd1eeb40e81137f22ab794b',
            },
            currencyId: '137-0x236aa50979d5f3de3bd1eeb40e81137f22ab794b',
            logoUrl:
              'https://coin-images.coingecko.com/coins/images/11224/large/0x18084fba666a33d37592fa2633fd49a74dd93a88.png?1696511155',
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
              decimals: 18,
              symbol: 'UNI',
              name: 'Uniswap (PoS)',
              isNative: false,
              isToken: true,
              address: '0xb33eaad8d922b1083446dc23f610c2567fb5180f',
            },
            currencyId: '137-0xb33eaad8d922b1083446dc23f610c2567fb5180f',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/12504/large/uniswap-logo.png?1720676669',
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
              decimals: 18,
              symbol: 'VOXEL',
              name: 'VOXEL Token',
              isNative: false,
              isToken: true,
              address: '0xd0258a3fd00f38aa8090dfee343f10a9d4d30d3f',
            },
            currencyId: '137-0xd0258a3fd00f38aa8090dfee343f10a9d4d30d3f',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/21260/large/Voxies_color_icon.png?1715217306',
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
              decimals: 18,
              symbol: 'WOO',
              name: 'WOO Network',
              isNative: false,
              isToken: true,
              address: '0x1b815d120b3ef02039ee11dc2d33de7aa4a8c603',
            },
            currencyId: '137-0x1b815d120b3ef02039ee11dc2d33de7aa4a8c603',
            logoUrl:
              'https://coin-images.coingecko.com/coins/images/12921/large/WOO_Logos_2023_Profile_Pic_WOO.png?1696512709',
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
              decimals: 18,
              symbol: 'WETH',
              name: 'Wrapped Ether',
              isNative: false,
              isToken: true,
              address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
            },
            currencyId: '137-0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/39708/large/WETH.PNG?1723730343',
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
              decimals: 18,
              symbol: 'WPOL',
              name: 'Wrapped POL',
              isNative: false,
              isToken: true,
              address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
            },
            currencyId: '137-0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/14073/large/matic.png?1696513797',
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
              decimals: 9,
              symbol: 'SOL',
              name: 'Wrapped SOL (Wormhole)',
              isNative: false,
              isToken: true,
              address: '0xd93f7e271cb87c23aaa73edc008a79646d1f9912',
            },
            currencyId: '137-0xd93f7e271cb87c23aaa73edc008a79646d1f9912',
            logoUrl: 'https://coin-images.coingecko.com/coins/images/22876/large/SOL_wh_small.png?1696522175',
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
              symbol: 'XSGD',
              name: 'XSGD',
              isNative: false,
              isToken: true,
              address: '0xdc3326e71d45186f113a2f448984ca0e8d201995',
            },
            currencyId: '137-0xdc3326e71d45186f113a2f448984ca0e8d201995',
            logoUrl:
              'https://coin-images.coingecko.com/coins/images/12832/large/StraitsX_Singapore_Dollar_%28XSGD%29_Token_Logo.png?1696512623',
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
              decimals: 18,
              symbol: 'YGG',
              name: 'Yield Guild Games',
              isNative: false,
              isToken: true,
              address: '0x82617aa52dddf5ed9bb7b370ed777b3182a30fd1',
            },
            currencyId: '137-0x82617aa52dddf5ed9bb7b370ed777b3182a30fd1',
            logoUrl:
              'https://coin-images.coingecko.com/coins/images/17358/large/Shield_Mark_-_Colored_-_Iridescent.png?1696516909',
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
      sections={loading ? undefined : tokens}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapOutputList = memo(_TokenSelectorSwapOutputList)
