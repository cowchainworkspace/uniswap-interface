/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RequestId } from './RequestId';
import type { TransactionRequest } from './TransactionRequest';
import { GasEstimate } from "../../types";

export type CreateSendResponse = {
    requestId: RequestId;
    send: TransactionRequest;
    gasFee?: string;
    gasFeeUSD?: number;
    gasEstimates?: GasEstimate[];
};

