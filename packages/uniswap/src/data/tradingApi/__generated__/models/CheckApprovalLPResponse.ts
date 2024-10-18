/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NullablePermit } from './NullablePermit';
import type { RequestId } from './RequestId';
import type { TransactionRequest } from './TransactionRequest';
export type CheckApprovalLPResponse = {
    requestId?: RequestId;
    token0Approval?: TransactionRequest;
    token1Approval?: TransactionRequest;
    positionTokenApproval?: TransactionRequest;
    permitData?: NullablePermit;
    gasFeeToken0Approval?: string;
    gasFeeToken1Approval?: string;
    gasFeePositionTokenApproval?: string;
};

