/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { ChainId } from './ChainId';
import type { ProtocolItems } from './ProtocolItems';
export type CheckApprovalLPRequest = {
    protocol?: ProtocolItems;
    token0?: Address;
    token1?: Address;
    positionToken?: Address;
    chainId?: ChainId;
    walletAddress?: Address;
    amount0?: string;
    amount1?: string;
    positionAmount?: string;
    simulateTransaction?: boolean;
};

