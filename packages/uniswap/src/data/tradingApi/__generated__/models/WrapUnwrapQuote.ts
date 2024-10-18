/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { ChainId } from './ChainId';
import type { ClassicInput } from './ClassicInput';
import type { ClassicOutput } from './ClassicOutput';
import type { TradeType } from './TradeType';
export type WrapUnwrapQuote = {
    swapper?: Address;
    input?: ClassicInput;
    output?: ClassicOutput;
    chainId?: ChainId;
    tradeType?: TradeType;
    /**
     * The gas fee in terms of wei.
     */
    gasFee?: string;
    /**
     * The gas fee in terms of USD.
     */
    gasFeeUSD?: string;
    /**
     * The gas fee in terms of the quoted currency.
     */
    gasFeeQuote?: string;
    /**
     * The estimated gas use.
     */
    gasUseEstimate?: string;
    /**
     * The gas price in terms of wei for pre EIP1559 transactions.
     */
    gasPrice?: string;
    /**
     * The maximum fee per gas in terms of wei for EIP1559 transactions.
     */
    maxFeePerGas?: string;
    /**
     * The maximum priority fee per gas in terms of wei for EIP1559 transactions.
     */
    maxPriorityFeePerGas?: string;
};

