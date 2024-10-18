/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSendRequest } from '../models/CreateSendRequest';
import type { CreateSendResponse } from '../models/CreateSendResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SendService {
    /**
     * Create send calldata
     * Create the calldata for a send transaction.
     * @returns CreateSendResponse Create send successful.
     * @throws ApiError
     */
    public static createSend({
        requestBody,
    }: {
        requestBody?: CreateSendRequest,
    }): CancelablePromise<CreateSendResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/send',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `RequestValidationError, Bad Input`,
                401: `UnauthorizedError eg. Account is blocked.`,
                404: `ResourceNotFound eg. Gas fee not available`,
                429: `Ratelimited`,
                500: `Unexpected error`,
                504: `Request duration limit reached.`,
            },
        });
    }
}
