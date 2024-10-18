/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChainId } from './ChainId';
import type { TradeType } from './TradeType';
export type IndicativeQuoteRequest = {
    type: TradeType;
    amount: string;
    tokenInChainId: ChainId;
    tokenOutChainId: ChainId;
    tokenIn: string;
    tokenOut: string;
};

