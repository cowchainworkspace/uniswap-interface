/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChainId } from './ChainId';
import type { CosignerData } from './CosignerData';
import type { OrderInput } from './OrderInput';
import type { OrderOutput } from './OrderOutput';
import type { OrderStatus } from './OrderStatus';
import type { OrderType } from './OrderType';
import type { SettledAmount } from './SettledAmount';
export type UniswapXOrder = {
    type: OrderType;
    encodedOrder: string;
    signature: string;
    nonce: string;
    orderStatus: OrderStatus;
    orderId: string;
    chainId: ChainId;
    quoteId?: string;
    swapper?: string;
    txHash?: string;
    input?: OrderInput;
    outputs?: Array<OrderOutput>;
    settledAmounts?: Array<SettledAmount>;
    cosignature?: string;
    cosignerData?: CosignerData;
};

