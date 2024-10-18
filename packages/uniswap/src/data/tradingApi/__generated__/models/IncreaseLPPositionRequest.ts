/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { ChainId } from './ChainId';
import type { Permit } from './Permit';
import type { Position } from './Position';
import type { ProtocolItems } from './ProtocolItems';
export type IncreaseLPPositionRequest = {
    protocol?: ProtocolItems;
    tokenId?: number;
    position?: Position;
    poolLiquidity?: string;
    currentTick?: number;
    sqrtRatioX96?: string;
    walletAddress?: Address;
    chainId?: ChainId;
    amount0?: string;
    amount1?: string;
    slippageTolerance?: string;
    deadline?: number;
    /**
     * The signed permit.
     */
    signature?: string;
    batchPermitData?: Permit;
    simulateTransaction?: boolean;
};

