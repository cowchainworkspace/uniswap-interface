import { TradeType } from '@uniswap/sdk-core'
import { useMemo, useRef } from 'react'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { useTradingApiQuoteQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiQuoteQuery'
import { TradeType as TradingApiTradeType } from 'uniswap/src/data/tradingApi/__generated__/index'
import { useActiveGasStrategy, useShadowGasStrategies } from 'uniswap/src/features/gas/hooks'
import { areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useIndicativeTrade } from 'uniswap/src/features/transactions/swap/hooks/useIndicativeTrade'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { TradeWithStatus, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  SWAP_GAS_URGENCY_OVERRIDE,
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
  transformTradingApiResponseToTrade,
  useQuoteRoutingParams,
  validateTrade,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS, inXMinutesUnix } from 'utilities/src/time/time'

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

// The TradingAPI requires an address for the swapper field; we supply a placeholder address if no account is connected.
// Note: This address was randomly generated.
const UNCONNECTED_ADDRESS = '0xAAAA44272dc658575Ba38f43C438447dDED45358'

const DEFAULT_SWAP_VALIDITY_TIME_MINS = 30

const routes = {
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359-EXACT_INPUT': {
    requestId: '9eb975ea-50a7-4ddc-8408-d09526d41335',
    routing: 'CLASSIC',
    quote: {
      chainId: 137,
      input: {
        amount: '28627246756020160926137',
        token: '0x0000000000000000000000000000000000000000',
      },
      output: {
        amount: '10000000000',
        token: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        recipient: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
      },
      swapper: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
      route: [
        [
          {
            type: 'v3-pool',
            address: '0x86f1d8390222A3691C28938eC7404A1661E618e0',
            tokenIn: {
              chainId: 137,
              decimals: '18',
              address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
              symbol: 'WMATIC',
            },
            tokenOut: {
              chainId: 137,
              decimals: '18',
              address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
              symbol: 'WETH',
            },
            fee: '500',
            liquidity: '244614048706294846539081',
            sqrtRatioX96: '929374273660209481930058635',
            tickCurrent: '-88916',
            amountIn: '12911711743580247278430',
          },
          {
            type: 'v3-pool',
            address: '0xA4D8c89f0c20efbe54cBa9e7e7a7E509056228D9',
            tokenIn: {
              chainId: 137,
              decimals: '18',
              address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
              symbol: 'WETH',
            },
            tokenOut: {
              chainId: 137,
              decimals: '6',
              address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
              symbol: 'USDC',
            },
            fee: '500',
            liquidity: '316284856009627639',
            sqrtRatioX96: '1570636710533593903856451611591651',
            tickCurrent: '197903',
            amountOut: '4511250000',
          },
        ],
        [
          {
            type: 'v3-pool',
            address: '0xA374094527e1673A86dE625aa59517c5dE346d32',
            tokenIn: {
              chainId: 137,
              decimals: '18',
              address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
              symbol: 'WMATIC',
            },
            tokenOut: {
              chainId: 137,
              decimals: '6',
              address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
              symbol: 'USDC',
            },
            fee: '500',
            liquidity: '8421652106018655866',
            sqrtRatioX96: '46844045353192649360854',
            tickCurrent: '-286835',
            amountIn: '8612500863614411064725',
          },
          {
            type: 'v3-pool',
            address: '0xD36ec33c8bed5a9F7B6630855f1533455b98a418',
            tokenIn: {
              chainId: 137,
              decimals: '6',
              address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
              symbol: 'USDC',
            },
            tokenOut: {
              chainId: 137,
              decimals: '6',
              address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
              symbol: 'USDC',
            },
            fee: '100',
            liquidity: '40613966979189285',
            sqrtRatioX96: '79232709377456704355917831008',
            tickCurrent: '1',
            amountOut: '3007500000',
          },
        ],
        [
          {
            type: 'v3-pool',
            address: '0xB6e57ed85c4c9dbfEF2a68711e9d6f36c56e0FcB',
            tokenIn: {
              chainId: 137,
              decimals: '18',
              address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
              symbol: 'WMATIC',
            },
            tokenOut: {
              chainId: 137,
              decimals: '6',
              address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
              symbol: 'USDC',
            },
            fee: '500',
            liquidity: '2858439549920308502',
            sqrtRatioX96: '46860365445220571553722',
            tickCurrent: '-286828',
            amountIn: '4304812431852093699323',
            amountOut: '1503750000',
          },
        ],
        [
          {
            type: 'v3-pool',
            address: '0x2DB87C4831B2fec2E35591221455834193b50D1B',
            tokenIn: {
              chainId: 137,
              decimals: '18',
              address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
              symbol: 'WMATIC',
            },
            tokenOut: {
              chainId: 137,
              decimals: '6',
              address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
              symbol: 'USDC',
            },
            fee: '3000',
            liquidity: '1331229188576091523',
            sqrtRatioX96: '46927576435475771003736',
            tickCurrent: '-286800',
            amountIn: '2869789833863459285974',
            amountOut: '1002500000',
          },
        ],
      ],
      slippage: 0.5,
      tradeType: 'EXACT_OUTPUT',
      quoteId: '14bb26fb-2101-476a-90bb-7478419f0781',
      gasFeeUSD: '0.010677',
      gasFeeQuote: '30550715541024000',
      gasUseEstimate: '817000',
      priceImpact: 0.2,
      txFailureReasons: [],
      maxPriorityFeePerGas: '52486828670',
      maxFeePerGas: '62345512528',
      gasFee: '50936283735376000',
      routeString:
        '[V3] 45.00% = WMATIC -- 0.05% [0x86f1d8390222A3691C28938eC7404A1661E618e0]WETH -- 0.05% [0xA4D8c89f0c20efbe54cBa9e7e7a7E509056228D9]USDC, [V3] 30.00% = WMATIC -- 0.05% [0xA374094527e1673A86dE625aa59517c5dE346d32]USDC -- 0.01% [0xD36ec33c8bed5a9F7B6630855f1533455b98a418]USDC, [V3] 15.00% = WMATIC -- 0.05% [0xB6e57ed85c4c9dbfEF2a68711e9d6f36c56e0FcB]USDC, [V3] 10.00% = WMATIC -- 0.3% [0x2DB87C4831B2fec2E35591221455834193b50D1B]USDC',
      blockNumber: '63476159',
      portionAmount: '25000000',
      portionBips: 25,
      portionRecipient: '0x7FFC3DBF3B2b50Ff3A1D5523bc24Bb5043837B14',
    },
    permitData: null,
  },
  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F-0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359-EXACT_OUTPUT': {
    requestId: 'ce1b23e9-7454-4656-a453-044169ce04c7',
    routing: 'CLASSIC',
    quote: {
      chainId: 137,
      input: {
        amount: '10006268194',
        token: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      },
      output: {
        amount: '10000000000',
        token: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        recipient: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
      },
      swapper: '0xAAAA44272dc658575Ba38f43C438447dDED45358',
      route: [
        [
          {
            type: 'v3-pool',
            address: '0x31083a78E11B18e450fd139F9ABEa98CD53181B7',
            tokenIn: {
              chainId: 137,
              decimals: '6',
              address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
              symbol: 'USDT',
            },
            tokenOut: {
              chainId: 137,
              decimals: '6',
              address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
              symbol: 'USDC',
            },
            fee: '100',
            liquidity: '2477798134735051',
            sqrtRatioX96: '79248866786002095238077745064',
            tickCurrent: '5',
            amountIn: '10006268194',
            amountOut: '10000000000',
          },
        ],
      ],
      slippage: 0.5,
      tradeType: 'EXACT_OUTPUT',
      quoteId: 'ce6f53a3-4832-4a0d-a9d8-698bc44c67fc',
      gasFeeUSD: '0.001561',
      gasFeeQuote: '1561',
      gasUseEstimate: '97000',
      priceImpact: 0.01,
      txFailureReasons: [],
      maxPriorityFeePerGas: '32390459391',
      maxFeePerGas: '54286108995',
      gasFee: '5265752572515000',
      routeString: '[V3] 100.00% = USDT -- 0.01% [0x31083a78E11B18e450fd139F9ABEa98CD53181B7]USDC',
      blockNumber: '63476354',
    },
    permitData: {
      domain: {
        name: 'Permit2',
        chainId: 137,
        verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
      },
      types: {
        PermitSingle: [
          {
            name: 'details',
            type: 'PermitDetails',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'sigDeadline',
            type: 'uint256',
          },
        ],
        PermitDetails: [
          {
            name: 'token',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint160',
          },
          {
            name: 'expiration',
            type: 'uint48',
          },
          {
            name: 'nonce',
            type: 'uint48',
          },
        ],
      },
      values: {
        details: {
          token: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          amount: '1461501637330902918203684832716283019655932542975',
          expiration: '1732460984',
          nonce: '0',
        },
        spender: '0xec7BE89e9d109e7e3Fec59c222CF297125FEFda2',
        sigDeadline: '1729870784',
      },
    },
  },
}

export class NoRoutesError extends Error {
  constructor(message: string = 'No routes found') {
    super(message)
    this.name = 'NoRoutesError'
  }
}

export function useTrade({
  account,
  amountSpecified: amount,
  otherCurrency,
  tradeType,
  pollInterval,
  customSlippageTolerance,
  isUSDQuote,
  skip,
  selectedProtocols,
  isDebouncing,
}: UseTradeArgs): TradeWithStatus {
  const activeAccountAddress = account?.address

  /***** Format request arguments ******/

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amount?.currency : otherCurrency
  const currencyOut = tradeType === TradeType.EXACT_OUTPUT ? amount?.currency : otherCurrency
  const currencyInEqualsCurrencyOut =
    currencyIn && currencyOut && areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))

  const tokenInChainId = toTradingApiSupportedChainId(currencyIn?.chainId)
  const tokenOutChainId = toTradingApiSupportedChainId(currencyOut?.chainId)
  const tokenInAddress = getTokenAddressForApi(currencyIn)
  const tokenOutAddress = getTokenAddressForApi(currencyOut)
  const activeGasStrategy = useActiveGasStrategy(tokenInChainId, 'swap')
  const shadowGasStrategies = useShadowGasStrategies(tokenInChainId, 'swap')

  const routingParams = useQuoteRoutingParams(selectedProtocols, currencyIn?.chainId, currencyOut?.chainId, isUSDQuote)

  const requestTradeType =
    tradeType === TradeType.EXACT_INPUT ? TradingApiTradeType.EXACT_INPUT : TradingApiTradeType.EXACT_OUTPUT

  const skipQuery =
    skip ||
    !tokenInAddress ||
    !tokenOutAddress ||
    !tokenInChainId ||
    !tokenOutChainId ||
    !amount ||
    currencyInEqualsCurrencyOut

  const v4Enabled = useFeatureFlag(FeatureFlags.V4Swap)

  const quoteRequestArgs = useMemo((): Parameters<typeof useTradingApiQuoteQuery>[0]['params'] | undefined => {
    if (skipQuery) {
      return undefined
    }
    return {
      type: requestTradeType,
      amount: amount.quotient.toString(),
      swapper: activeAccountAddress ?? UNCONNECTED_ADDRESS,
      tokenInChainId,
      tokenOutChainId,
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      slippageTolerance: customSlippageTolerance,
      urgency: SWAP_GAS_URGENCY_OVERRIDE,
      gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])],
      v4Enabled,
      isUSDQuote,
      ...routingParams,
    }
  }, [
    activeAccountAddress,
    amount,
    customSlippageTolerance,
    activeGasStrategy,
    shadowGasStrategies,
    requestTradeType,
    routingParams,
    skipQuery,
    tokenInAddress,
    tokenInChainId,
    tokenOutAddress,
    tokenOutChainId,
    v4Enabled,
    isUSDQuote,
  ])

  /***** Fetch quote from trading API  ******/

  const pollingIntervalForChain = usePollingIntervalByChain(currencyIn?.chainId)
  const internalPollInterval = pollInterval ?? pollingIntervalForChain

  // const key = `${quoteRequestArgs?.tokenIn}-${quoteRequestArgs?.tokenOut}-${quoteRequestArgs?.type}`
  // console.log('key: ', key);
  const response = useTradingApiQuoteQuery({
    params: quoteRequestArgs,
    refetchInterval: internalPollInterval,
    staleTime: internalPollInterval,
    // We set the `gcTime` to 15 seconds longer than the refetch interval so that there's more than enough time for a refetch to complete before we clear the stale data.
    // If the user loses internet connection (or leaves the app and comes back) for longer than this,
    // then we clear stale data and show a big loading spinner in the swap review screen.
    immediateGcTime: internalPollInterval + ONE_SECOND_MS * 15,
  })

  let { error, data, isLoading: queryIsLoading, isFetching, errorUpdatedAt, dataUpdatedAt } = response
  // if(routes[key]) {
  //   data = routes[key]
  // }

  const errorRef = useRef<Error | null>(error)

  // We want to keep the error while react-query is refetching, so that the error message doesn't go in and out while it's polling.
  if (errorUpdatedAt > dataUpdatedAt) {
    // If there's a new error, save the new one. If there's no error (we're re-fetching), keep the old one.
    errorRef.current = error ?? errorRef.current
  } else {
    errorRef.current = error
  }

  const isLoading = (amount && isDebouncing) || queryIsLoading

  const indicativeQuotesEnabled = useFeatureFlag(FeatureFlags.IndicativeSwapQuotes)
  const indicative = useIndicativeTrade({
    quoteRequestArgs,
    currencyIn,
    currencyOut,
    customSlippageTolerance,
    skip: !indicativeQuotesEnabled || isUSDQuote,
  })

  /***** Format `trade` type, add errors if needed.  ******/

  return useMemo(() => {
    // Error logging
    // We use DataDog to catch network errors on Mobile
    if (error && (!isMobileApp || !(error instanceof FetchError)) && !isUSDQuote) {
      logger.error(error, { tags: { file: 'useTrade', function: 'quote' } })
    }

    if (data && !data.quote) {
      logger.error(new Error('Unexpected empty Trading API response'), {
        tags: { file: 'useTrade', function: 'quote' },
        extra: {
          quoteRequestArgs,
        },
      })
    }

    let gasEstimates: GasFeeEstimates | undefined
    if (data?.quote && 'gasEstimates' in data.quote && data.quote.gasEstimates) {
      // Only classic quotes include gasEstimates
      const activeGasEstimate = data.quote.gasEstimates.find((e) =>
        areEqualGasStrategies(e.strategy, activeGasStrategy),
      )
      gasEstimates = activeGasEstimate
        ? {
            activeEstimate: activeGasEstimate,
            shadowEstimates: data.quote.gasEstimates.filter((e) => e !== activeGasEstimate),
          }
        : undefined
    }

    if (!data?.quote || !currencyIn || !currencyOut) {
      return {
        isLoading,
        isFetching,
        trade: null,
        indicativeTrade: isLoading ? indicative.trade : undefined,
        isIndicativeLoading: isDebouncing || indicative.isLoading,
        error: errorRef.current,
        gasEstimates,
      }
    }

    const formattedTrade = transformTradingApiResponseToTrade({
      currencyIn,
      currencyOut,
      tradeType,
      deadline: inXMinutesUnix(DEFAULT_SWAP_VALIDITY_TIME_MINS), // TODO(MOB-3050): set deadline as `quoteRequestArgs.deadline`
      slippageTolerance: customSlippageTolerance,
      data,
    })

    const exactCurrencyField = tradeType === TradeType.EXACT_INPUT ? CurrencyField.INPUT : CurrencyField.OUTPUT

    const trade = validateTrade({
      trade: formattedTrade,
      currencyIn,
      currencyOut,
      exactAmount: amount,
      exactCurrencyField,
    })

    // If `transformTradingApiResponseToTrade` returns a `null` trade, it means we have a non-null quote, but no routes.
    if (trade === null) {
      return {
        isLoading,
        isFetching,
        trade: null,
        indicativeTrade: undefined, // We don't want to show the indicative trade if there is no completable trade
        isIndicativeLoading: false,
        error: new NoRoutesError(),
        gasEstimates,
      }
    }

    return {
      isLoading: isDebouncing || isLoading,
      isFetching,
      trade,
      indicativeTrade: indicative.trade,
      isIndicativeLoading: isDebouncing || indicative.isLoading,
      error,
      gasEstimates,
    }
  }, [
    activeGasStrategy,
    amount,
    currencyIn,
    currencyOut,
    customSlippageTolerance,
    data,
    error,
    isDebouncing,
    isFetching,
    isLoading,
    isUSDQuote,
    indicative.trade,
    indicative.isLoading,
    quoteRequestArgs,
    tradeType,
  ])
}
