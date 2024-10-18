/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { ClassicGasUseEstimateUSD } from './ClassicGasUseEstimateUSD';
import type { DutchOrderInfoV2 } from './DutchOrderInfoV2';
export type DutchQuoteV2 = {
    encodedOrder: string;
    orderId: string;
    orderInfo: DutchOrderInfoV2;
    portionBips?: number;
    portionAmount?: string;
    portionRecipient?: Address;
    quoteId?: string;
    slippageTolerance?: number;
    deadlineBufferSecs?: number;
    classicGasUseEstimateUSD?: ClassicGasUseEstimateUSD;
};

