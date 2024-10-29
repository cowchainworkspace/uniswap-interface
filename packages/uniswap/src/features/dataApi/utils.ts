import { ApolloError } from '@apollo/client'
import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { useRef } from 'react'
import {
  Chain,
  ContractInput,
  ProtectionAttackType,
  ProtectionResult,
  SafetyLevel,
  TokenProjectsQuery,
  TokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { AttackType, CurrencyInfo, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyId } from 'uniswap/src/types/currency'
import {
  currencyId,
  currencyIdToChain,
  currencyIdToGraphQLAddress,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'

type BuildCurrencyParams = {
  chainId?: Nullable<UniverseChainId>
  address?: Nullable<string>
  decimals?: Nullable<number>
  symbol?: Nullable<string>
  name?: Nullable<string>
  bypassChecksum?: boolean
  buyFeeBps?: string
  sellFeeBps?: string
}

// Converts CurrencyId to ContractInput format for GQL token queries
export function currencyIdToContractInput(id: CurrencyId): ContractInput {
  return {
    // TODO: WALL-4919: Remove hardcoded Mainnet
    chain: toGraphQLChain(currencyIdToChain(id) ?? UniverseChainId.Mainnet) ?? Chain.Ethereum,
    address: currencyIdToGraphQLAddress(id) ?? undefined,
  }
}

export function tokenProjectToCurrencyInfos(
  tokenProjects: TokenProjectsQuery['tokenProjects'],
  chainFilter?: UniverseChainId | null,
): CurrencyInfo[] {
  return tokenProjects
    ?.flatMap((project) =>
      project?.tokens.map((token) => {
        const { logoUrl, safetyLevel } = project ?? {}
        const { name, chain, address, decimals, symbol } = token ?? {}
        const chainId = fromGraphQLChain(chain)

        if (chainFilter && chainFilter !== chainId) {
          return null
        }

        const currency = buildCurrency({
          chainId,
          address,
          decimals,
          symbol,
          name,
        })

        if (!currency) {
          return null
        }

        const currencyInfo: CurrencyInfo = {
          currency,
          currencyId: currencyId(currency),
          logoUrl,
          safetyLevel,
          safetyInfo: {
            tokenList: getTokenListFromSafetyLevel(project?.safetyLevel),
            protectionResult: ProtectionResult.Unknown,
          },
        }

        return currencyInfo
      }),
    )
    .filter(Boolean) as CurrencyInfo[]
}

// use inverse check here (instead of isNativeAddress) so we can typeguard address as must be string if this is true
function isNonNativeAddress(chainId: UniverseChainId, address: Maybe<string>): address is string {
  return !isNativeCurrencyAddress(chainId, address)
}

/**
 * Creates a new instance of Token or NativeCurrency.
 *
 * @param params The parameters for building the currency.
 * @param params.chainId The ID of the chain where the token resides. If not provided, the function will return undefined.
 * @param params.address The token's address. If not provided, an instance of NativeCurrency is returned.
 * @param params.decimals The decimal count used by the token. If not provided, the function will return undefined.
 * @param params.symbol The token's symbol. This parameter is optional.
 * @param params.name The token's name. This parameter is optional.
 * @param params.bypassChecksum If true, bypasses the EIP-55 checksum on the token address. This parameter is optional and defaults to true.
 * @returns A new instance of Token or NativeCurrency if the parameters are valid, otherwise returns undefined.
 */
export function buildCurrency({
  chainId,
  address,
  decimals,
  symbol,
  name,
  bypassChecksum = true,
  buyFeeBps,
  sellFeeBps,
}: BuildCurrencyParams): Token | NativeCurrency | undefined {
  if (!chainId || decimals === undefined || decimals === null) {
    return undefined
  }

  const buyFee = buyFeeBps && BigNumber.from(buyFeeBps).gt(0) ? BigNumber.from(buyFeeBps) : undefined
  const sellFee = sellFeeBps && BigNumber.from(sellFeeBps).gt(0) ? BigNumber.from(sellFeeBps) : undefined

  return isNonNativeAddress(chainId, address)
    ? new Token(chainId, address, decimals, symbol ?? undefined, name ?? undefined, bypassChecksum, buyFee, sellFee)
    : NativeCurrency.onChain(chainId)
}

function getTokenListFromSafetyLevel(safetyInfo?: SafetyLevel): TokenList {
  switch (safetyInfo) {
    case SafetyLevel.Blocked:
      return TokenList.Blocked
    case SafetyLevel.Verified:
      return TokenList.Default
    default:
      return TokenList.NonDefault
  }
}

// Priority based on Token Protection PRD spec
function getHighestPriorityAttackType(attackTypes?: (ProtectionAttackType | undefined)[]): AttackType | undefined {
  if (!attackTypes || attackTypes.length === 0) {
    return undefined
  }
  const attackTypeSet = new Set(attackTypes)
  if (attackTypeSet.has(ProtectionAttackType.Impersonator)) {
    return AttackType.Impersonator
  } else if (attackTypeSet.has(ProtectionAttackType.AirdropPattern)) {
    return AttackType.Airdrop
  } else {
    return AttackType.Other
  }
}

export function getCurrencySafetyInfo(
  safetyLevel?: SafetyLevel,
  protectionInfo?: NonNullable<TokenQuery['token']>['protectionInfo'],
): SafetyInfo {
  return {
    tokenList: getTokenListFromSafetyLevel(safetyLevel),
    attackType: getHighestPriorityAttackType(protectionInfo?.attackTypes),
    protectionResult: protectionInfo?.result ?? ProtectionResult.Unknown,
  }
}

const tokens = {
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': {
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
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': {
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

  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': {
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

  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': {
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

  '0x0000000000000000000000000000000000001010': {
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
    safetyInfo: {
      tokenList: 'default',
      protectionResult: 'BENIGN',
    },
    safetyLevel: 'VERIFIED',
    isSpam: false,
  },
}

export function gqlTokenToCurrencyInfo(token: NonNullable<NonNullable<TokenQuery['token']>>): CurrencyInfo | null {
  const { name, chain, address, decimals, symbol, project, feeData, protectionInfo } = token

  //@ts-ignore
  if (address && tokens[address]) {
    //@ts-ignore
    return tokens[address]
  }
  const chainId = fromGraphQLChain(chain)

  const currency = buildCurrency({
    chainId,
    address,
    decimals,
    symbol,
    name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  const currencyInfo: CurrencyInfo = {
    currency,
    currencyId: currencyId(currency),
    logoUrl: project?.logoUrl,
    safetyInfo: getCurrencySafetyInfo(project?.safetyLevel, protectionInfo),
    // TODO (WALL-4626): remove safetyLevel in lieu of safetyInfo.tokenList
    safetyLevel: project?.safetyLevel ?? SafetyLevel.StrongWarning,
    // defaulting to not spam. currently this flow triggers when a user is searching
    // for a token, in which case the user probably doesn't expect the token to be spam
    isSpam: project?.isSpam ?? false,
  }
  console.log({ [address?.toLowerCase()]: currencyInfo })
  return currencyInfo
}

/*
Apollo client clears errors when repolling, so if there's an error and we have a
polling interval defined for the endpoint, then `error` will flicker between
being defined and not defined. This hook helps persist returned errors when polling
until the network request returns.

Feature request to enable persisted errors: https://github.com/apollographql/apollo-feature-requests/issues/348
*/
export function usePersistedError(loading: boolean, error?: ApolloError): ApolloError | undefined {
  const persistedErrorRef = useRef<ApolloError>()

  if (error || !loading) {
    persistedErrorRef.current = error
  }

  return persistedErrorRef.current
}
