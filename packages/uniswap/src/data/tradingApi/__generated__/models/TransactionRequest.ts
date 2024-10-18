/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
export type TransactionRequest = {
    to: Address;
    from: Address;
    /**
     * The calldata for the transaction.
     */
    data: string;
    /**
     * The value of the transaction in terms of wei in hex format.
     */
    value: string;
    gasLimit?: string;
    chainId: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gasPrice?: string;
};

