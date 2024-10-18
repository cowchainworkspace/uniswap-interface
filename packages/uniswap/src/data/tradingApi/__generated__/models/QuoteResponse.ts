/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NullablePermit } from './NullablePermit';
import type { Quote } from './Quote';
import type { RequestId } from './RequestId';
import type { Routing } from './Routing';
export type QuoteResponse = {
    requestId: RequestId;
    quote: Quote;
    routing: Routing;
    permitData: NullablePermit;
};

