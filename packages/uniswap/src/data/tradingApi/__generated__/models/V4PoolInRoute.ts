/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from './Address';
import type { TokenInRoute } from './TokenInRoute';
export type V4PoolInRoute = {
    type: string;
    address: Address;
    tokenIn: TokenInRoute;
    tokenOut: TokenInRoute;
    sqrtRatioX96: string;
    liquidity: string;
    tickCurrent: string;
    fee: string;
    tickSpacing: string;
    hooks: string;
    amountIn?: string;
    amountOut?: string;
};

