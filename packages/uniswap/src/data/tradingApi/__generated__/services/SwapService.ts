/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChainId } from '../models/ChainId';
import type { CreateSwapRequest } from '../models/CreateSwapRequest';
import type { CreateSwapResponse } from '../models/CreateSwapResponse';
import type { GetSwapsResponse } from '../models/GetSwapsResponse';
import type { TransactionHash } from '../models/TransactionHash';
import type { UniversalRouterVersion } from '../models/UniversalRouterVersion';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SwapService {
    /**
     * Create swap calldata
     * Create the calldata for a swap transaction (including wrap/unwrap) against the Uniswap Protocols. If the `quote` parameter includes the fee parameters, then the calldata will include the fee disbursement. The gas estimates will be **more precise** when the the response calldata would be valid if submitted on-chain.
     * @returns CreateSwapResponse Create swap successful.
     * @throws ApiError
     */
    public static createSwapTransaction({
        xUniversalRouterVersion,
        requestBody,
    }: {
        /**
         * The version of the Universal Router to use for the swap journey. *MUST* be consistent throughout the API calls.
         */
        xUniversalRouterVersion?: UniversalRouterVersion,
        requestBody?: CreateSwapRequest,
    }): CancelablePromise<CreateSwapResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/swap',
            headers: {
                'x-universal-router-version': xUniversalRouterVersion,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `RequestValidationError, Bad Input`,
                401: `UnauthorizedError eg. Account is blocked or  Fee is not enabled.`,
                404: `ResourceNotFound eg. No quotes available or Gas fee/price not available`,
                419: `Ratelimited`,
                500: `Unexpected error`,
                504: `Request duration limit reached.`,
            },
        });
    }
    /**
     * Get swaps status
     * Get the status of a swap or bridge transactions.
     * @returns GetSwapsResponse Get swap successful.
     * @throws ApiError
     */
    public static getSwaps({
        txHashes,
        chainId,
    }: {
        /**
         * The transaction hashes.
         */
        txHashes: Array<TransactionHash>,
        chainId?: ChainId,
    }): CancelablePromise<GetSwapsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/swaps',
            query: {
                'txHashes': txHashes,
                'chainId': chainId,
            },
            errors: {
                400: `RequestValidationError, Bad Input`,
                404: `ResourceNotFound eg. No quotes available or Gas fee/price not available`,
                419: `Ratelimited`,
                500: `Unexpected error`,
                504: `Request duration limit reached.`,
            },
        });
    }
}
