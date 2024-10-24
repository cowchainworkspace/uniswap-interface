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

  const tokens = [
    {
        "sectionKey": "popularTokens",
        "data": [
            {
                "currencyInfo": {
                    "currency": {
                        "chainId": 137,
                        "decimals": 6,
                        "symbol": "USDT",
                        "name": "(PoS) Tether USD",
                        "isNative": false,
                        "isToken": true,
                        "address": "0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
                    },
                    "currencyId": "137-0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
                    "logoUrl": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
                    "safetyInfo": {
                        "tokenList": "default",
                        "protectionResult": "BENIGN"
                    },
                    "safetyLevel": "VERIFIED",
                    "isSpam": false
                },
                "balanceUSD": null,
                "quantity": null
            },
            {
                "currencyInfo": {
                    "currency": {
                        "chainId": 137,
                        "decimals": 6,
                        "symbol": "USDC",
                        "name": "USD Coin",
                        "isNative": false,
                        "isToken": true,
                        "address": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"
                    },
                    "currencyId": "137-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
                    "logoUrl": "https://coin-images.coingecko.com/coins/images/6319/large/usdc.png?1696506694",
                    "safetyInfo": {
                        "tokenList": "default",
                        "protectionResult": "BENIGN"
                    },
                    "safetyLevel": "VERIFIED",
                    "isSpam": false
                },
                "balanceUSD": null,
                "quantity": null
            }
        ]
    }
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
