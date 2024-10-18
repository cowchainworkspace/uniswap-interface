/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { ClassicGasUseEstimateUSD } from './ClassicGasUseEstimateUSD';
import type { DutchOrderInfo } from './DutchOrderInfo';
export type DutchQuote = {
    encodedOrder: string;
    orderId: string;
    orderInfo: DutchOrderInfo;
    portionBips?: number;
    portionAmount?: string;
    portionRecipient?: Address;
    quoteId?: string;
    slippageTolerance?: number;
    classicGasUseEstimateUSD?: ClassicGasUseEstimateUSD;
};

