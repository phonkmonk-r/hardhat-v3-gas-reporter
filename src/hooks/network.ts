import { hexToDecimal } from "../utils/gas.js";
import type {
  GasReporterExecutionContext,
  JsonRpcTx,
  ValidatedRequestArguments,
} from "../types.js";

// Shared state - set by the start task, read by the hook
let _executionContext: GasReporterExecutionContext | undefined;
let _isInitialized = false;

/**
 * Called by the start task to activate gas tracking in the network hook
 */
export function initializeNetworkHook(
  context: GasReporterExecutionContext
): void {
  _executionContext = context;
  _isInitialized = true;
}

/**
 * Reset the hook state (useful for testing)
 */
export function resetNetworkHook(): void {
  _executionContext = undefined;
  _isInitialized = false;
}

/**
 * Make an additional JSON-RPC call via the hook chain, extracting the result
 */
async function callRpc(
  context: any,
  conn: any,
  next: any,
  method: string,
  params: any[]
): Promise<any> {
  const response = await next(context, conn, {
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params,
  });
  // Handle both JsonRpcResponse format and raw result
  return response?.result !== undefined ? response.result : response;
}

/**
 * Check if we should track this eth_call (not a resolver internal call)
 */
function canEstimate(params: unknown[] | undefined): boolean {
  if (!_executionContext?.usingCall) return false;

  if (
    Array.isArray(params) &&
    params.length >= 1 &&
    typeof (params[0] as any)?.data === "string"
  ) {
    const sig = (params[0] as any).data.slice(2, 10);
    for (const method of _executionContext!.methodIgnoreList!) {
      if (method === sig) return false;
    }
  }
  return true;
}

/**
 * Handles calls for TruffleV5 (`eth_getTransactionReceipt`)
 */
async function handleTruffleV5(
  context: any,
  conn: any,
  request: any,
  next: any
): Promise<any> {
  const response = await next(context, conn, request);
  const receipt: any =
    response?.result !== undefined ? response.result : response;

  if (receipt?.status && receipt?.transactionHash) {
    const tx = await callRpc(
      context,
      conn,
      next,
      "eth_getTransactionByHash",
      [receipt.transactionHash]
    );
    await _executionContext!.collector?.collectTransaction(
      tx as JsonRpcTx,
      receipt
    );
  }
  return response;
}

/**
 * Handles calls for Ethers (`eth_getTransactionByHash`)
 */
async function handleEthers(
  context: any,
  conn: any,
  request: any,
  next: any
): Promise<any> {
  const receipt: any = await callRpc(
    context,
    conn,
    next,
    "eth_getTransactionReceipt",
    request.params
  );
  const response = await next(context, conn, request);
  const tx: any =
    response?.result !== undefined ? response.result : response;

  if (receipt?.status) {
    await _executionContext!.collector?.collectTransaction(
      tx as JsonRpcTx,
      receipt
    );
  }
  return response;
}

/**
 * Handles calls for Viem/Waffle (`eth_sendRawTransaction`, `eth_sendTransaction`)
 */
async function handleViemOrWaffle(
  context: any,
  conn: any,
  request: any,
  next: any
): Promise<any> {
  const response = await next(context, conn, request);
  const txHash =
    response?.result !== undefined ? response.result : response;

  if (typeof txHash === "string") {
    const tx = await callRpc(
      context,
      conn,
      next,
      "eth_getTransactionByHash",
      [txHash]
    );
    const receipt: any = await callRpc(
      context,
      conn,
      next,
      "eth_getTransactionReceipt",
      [txHash]
    );

    if (receipt?.status) {
      await _executionContext!.collector?.collectTransaction(
        tx as JsonRpcTx,
        receipt
      );
    }
  }
  return response;
}

/**
 * Handles `eth_call` (for pure and view fns)
 */
async function handleEthCall(
  context: any,
  conn: any,
  request: any,
  next: any
): Promise<any> {
  if (canEstimate(request.params)) {
    try {
      const gas = await callRpc(
        context,
        conn,
        next,
        "eth_estimateGas",
        request.params
      );

      const gasDecimal = hexToDecimal(gas as string);

      if (gasDecimal) {
        await _executionContext!.collector?.collectCall(
          { params: request.params } as ValidatedRequestArguments,
          gasDecimal
        );
      }
    } catch (err) {
      // Ignore estimation failures
    }
  }
  return next(context, conn, request);
}

export default async () => ({
  async onRequest(
    context: any,
    networkConnection: any,
    jsonRpcRequest: any,
    next: any
  ): Promise<any> {
    if (!_isInitialized) {
      return next(context, networkConnection, jsonRpcRequest);
    }

    const { method } = jsonRpcRequest;

    switch (method) {
      case "eth_call":
        return handleEthCall(context, networkConnection, jsonRpcRequest, next);
      case "eth_getTransactionReceipt":
        return handleTruffleV5(
          context,
          networkConnection,
          jsonRpcRequest,
          next
        );
      case "eth_getTransactionByHash":
        return handleEthers(context, networkConnection, jsonRpcRequest, next);
      case "eth_sendRawTransaction":
        return handleViemOrWaffle(
          context,
          networkConnection,
          jsonRpcRequest,
          next
        );
      case "eth_sendTransaction":
        if (_executionContext?.usingViem) {
          return handleViemOrWaffle(
            context,
            networkConnection,
            jsonRpcRequest,
            next
          );
        }
        return next(context, networkConnection, jsonRpcRequest);
      default:
        return next(context, networkConnection, jsonRpcRequest);
    }
  },
});
