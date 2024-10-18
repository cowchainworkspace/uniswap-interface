/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * For **Classic** swaps only. The auto slippage strategy to employ. If auto slippage is not defined then we don't compute it. If the auto slippage strategy is `DEFAULT`, then the swap will use the default slippage tolerance computation. You cannot define auto slippage and slippage tolerance at the same time.
 *
 * **NOTE**: slippage is in terms of trade type. If the trade type is `EXACT_INPUT`, then the slippage is in terms of the output token. If the trade type is `EXACT_OUTPUT`, then the slippage is in terms of the input token.
 */
export enum AutoSlippage {
    DEFAULT = 'DEFAULT',
}
