/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChainId } from './ChainId';
import type { DutchInput } from './DutchInput';
import type { DutchOutput } from './DutchOutput';
export type DutchOrderInfo = {
    chainId: ChainId;
    nonce: string;
    reactor: string;
    swapper: string;
    deadline: number;
    additionalValidationContract?: string;
    additionalValidationData?: string;
    decayStartTime?: number;
    decayEndTime?: number;
    exclusiveFiller: string;
    exclusivityOverrideBps: string;
    input: DutchInput;
    outputs: Array<DutchOutput>;
};

