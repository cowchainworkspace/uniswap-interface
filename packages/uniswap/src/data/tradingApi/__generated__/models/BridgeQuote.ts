/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { ChainId } from './ChainId';
import type { ClassicInput } from './ClassicInput';
import type { ClassicOutput } from './ClassicOutput';
import type { TradeType } from './TradeType';
export type BridgeQuote = {
    quoteId?: string;
    chainId?: ChainId;
    destinationChainId?: ChainId;
    swapper?: Address;
    input?: ClassicInput;
    output?: ClassicOutput;
    tradeType?: TradeType;
    quoteTimestamp?: number;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gasFee?: string;
    gasUseEstimate?: string;
    gasFeeUSD?: string;
    portionBips?: number;
    portionAmount?: string;
    portionRecipient?: Address;
    estimatedFillTimeMs?: number;
};

