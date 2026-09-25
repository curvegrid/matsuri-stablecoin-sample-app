import * as MultiBaas from '@curvegrid/multibaas-sdk';
import { MULTIBAAS_API_KEY, MULTIBAAS_BASE_URL } from './config';

export type MultiBaasCallResult<T> = {
  output?: T;
  tx?: MultiBaas.TransactionToSignTx;
};

// Build a MultiBaas API client from env vars.
// 環境変数から MultiBaas API クライアントを生成する。
export function createMultiBaasClient(): MultiBaas.ContractsApi {
  if (!MULTIBAAS_BASE_URL || !MULTIBAAS_API_KEY) {
    // Fail early so the UI can show a clear configuration error.
    // 早期に失敗させることで設定不足を明確にする。
    throw new Error('Missing MultiBaas config');
  }
  const basePath = new URL('/api/v0', MULTIBAAS_BASE_URL).toString();
  const config = new MultiBaas.Configuration({
    basePath,
    accessToken: MULTIBAAS_API_KEY
  });
  return new MultiBaas.ContractsApi(config);
}

// Build an EventQueries client for ad-hoc analytics.
// アドホック分析用の EventQueries クライアントを生成する。
export function createEventQueriesClient(): MultiBaas.EventQueriesApi {
  if (!MULTIBAAS_BASE_URL || !MULTIBAAS_API_KEY) {
    throw new Error('Missing MultiBaas config');
  }
  const basePath = new URL('/api/v0', MULTIBAAS_BASE_URL).toString();
  const config = new MultiBaas.Configuration({
    basePath,
    accessToken: MULTIBAAS_API_KEY
  });
  return new MultiBaas.EventQueriesApi(config);
}

// Call a contract method through MultiBaas and return either a tx or output.
// MultiBaas 経由でメソッドを呼び出し、トランザクションか戻り値を返す。
export async function callContract<T>(
  client: MultiBaas.ContractsApi,
  addressOrAlias: string,
  contractLabel: string,
  method: string,
  args: unknown[],
  from?: string
): Promise<MultiBaasCallResult<T>> {
  const payload: MultiBaas.PostMethodArgs = {
    args,
    from,
    contractOverride: true,
    // Ensure big integers are returned as strings for safer formatting.
    // 大きい数値を文字列で受け取り安全に整形する。
    formatInts: 'as_strings'
  };

  const resp = await client.callContractFunction(addressOrAlias, contractLabel, method, payload);
  const result = resp.data.result as MultiBaas.CallContractFunction200ResponseAllOfResult;
  if (result && 'tx' in result && result.tx) {
    return { tx: result.tx };
  }
  if (result && 'output' in result && result.output !== undefined) {
    return { output: result.output as T };
  }
  return {};
}
