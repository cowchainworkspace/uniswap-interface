/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApprovalRequest } from '../models/ApprovalRequest';
import type { ApprovalResponse } from '../models/ApprovalResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ApprovalService {
    /**
     * Check if token approval is required
     * Checks if the swapper has the required approval. If the swapper does not have the required approval, then the response will include the transaction to approve the token. If the swapper has the required approval, then the response will be empty. If the parameter `includeGasInfo` is set to `true`, then the response will include the gas fee for the approval transaction.
     * @returns ApprovalResponse Check approval successful.
     * @throws ApiError
     */
    public static checkApproval({
        requestBody,
    }: {
        requestBody?: ApprovalRequest,
    }): CancelablePromise<ApprovalResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/check_approval',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `RequestValidationError, Bad Input`,
                401: `UnauthorizedError eg. Account is blocked.`,
                404: `ResourceNotFound eg. Token allowance not found or Gas info not found.`,
                419: `Ratelimited`,
                500: `Unexpected error`,
                504: `Request duration limit reached.`,
            },
        });
    }
}
