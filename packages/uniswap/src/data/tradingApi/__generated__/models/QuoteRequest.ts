/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { AutoSlippage } from './AutoSlippage';
import type { ChainId } from './ChainId';
import type { Protocols } from './Protocols';
import type { RoutingPreference } from './RoutingPreference';
import type { SpreadOptimization } from './SpreadOptimization';
import type { TradeType } from './TradeType';
import type { Urgency } from './Urgency';
import { GasStrategy } from "../../types";

export type QuoteRequest = {
    type: TradeType;
    amount: string;
    tokenInChainId: ChainId;
    tokenOutChainId: ChainId;
    tokenIn: string;
    tokenOut: string;
    swapper: Address;
    /**
     * For **Classic** swaps, the slippage tolerance is the maximum amount the price can change between the time the transaction is submitted and the time it is executed. The slippage tolerance is represented as a percentage of the total value of the swap.
     *
     * Slippage tolerance works differently in **DutchLimit** swaps, it does not set a limit on the Spread in an order. See [here](https://uniswap-docs.readme.io/reference/faqs#why-do-the-uniswapx-quotes-have-more-slippage-than-the-tolerance-i-set) for more information.
     *
     * **NOTE**: slippage is in terms of trade type. If the trade type is `EXACT_INPUT`, then the slippage is in terms of the output token. If the trade type is `EXACT_OUTPUT`, then the slippage is in terms of the input token.
     */
    slippageTolerance?: number;
    autoSlippage?: AutoSlippage;
    routingPreference?: RoutingPreference;
    protocols?: Protocols;
    spreadOptimization?: SpreadOptimization;
    urgency?: Urgency;
    gasStrategies?: GasStrategy[];
};

