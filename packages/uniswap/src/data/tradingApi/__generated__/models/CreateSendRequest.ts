/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { ChainId } from './ChainId';
import type { TokenAmount } from './TokenAmount';
import type { Urgency } from './Urgency';
import { GasStrategy } from "../../types";

export type CreateSendRequest = {
    sender: Address;
    recipient: Address;
    token: Address;
    amount: TokenAmount;
    chainId?: ChainId;
    urgency?: Urgency;
    gasStrategies?: GasStrategy[];
};

