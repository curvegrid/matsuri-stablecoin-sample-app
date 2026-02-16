import { ADDRESS_ALIASES, CONTRACT_LABELS } from './config';
import { callContract, createMultiBaasClient } from './multibaas';

// Create a client per interaction to keep configuration centralized.
// 設定の一元化のため、呼び出しごとにクライアントを生成する。
export function getClient() {
  return createMultiBaasClient();
}

// Stablecoin reads.
// ステーブルコインの読み取り。
export async function getStablecoinBalance(client: ReturnType<typeof getClient>, address: string) {
  return callContract<string>(client, ADDRESS_ALIASES.stablecoin, CONTRACT_LABELS.stablecoin, 'balanceOf', [address]);
}

export async function getStablecoinTotalSupply(client: ReturnType<typeof getClient>) {
  return callContract<string>(client, ADDRESS_ALIASES.stablecoin, CONTRACT_LABELS.stablecoin, 'totalSupply', []);
}

// Voucher reads.
// バウチャーの読み取り。
export async function getVoucherBalance(client: ReturnType<typeof getClient>, address: string, eventId: number) {
  return callContract<string>(client, ADDRESS_ALIASES.voucher, CONTRACT_LABELS.voucher, 'balanceOf', [address, eventId]);
}

// eventInfo returns (price, available).
// eventInfo は (price, available) を返す。
export async function getVoucherEventInfo(client: ReturnType<typeof getClient>, eventId: number) {
  return callContract<[string, string]>(client, ADDRESS_ALIASES.voucher, CONTRACT_LABELS.voucher, 'eventInfo', [eventId]);
}

// Stablecoin writes.
// ステーブルコインの書き込み。
export async function mintStablecoin(
  client: ReturnType<typeof getClient>,
  to: string,
  amount: string,
  from: string
) {
  return callContract<unknown>(
    client,
    ADDRESS_ALIASES.stablecoin,
    CONTRACT_LABELS.stablecoin,
    'mint',
    [to, amount],
    from
  );
}

export async function burnStablecoin(
  client: ReturnType<typeof getClient>,
  fromAddress: string,
  amount: string,
  from: string
) {
  return callContract<unknown>(
    client,
    ADDRESS_ALIASES.stablecoin,
    CONTRACT_LABELS.stablecoin,
    'burn',
    [fromAddress, amount],
    from
  );
}

export async function approveVoucherSpend(
  client: ReturnType<typeof getClient>,
  spenderAlias: string,
  amount: string,
  from: string
) {
  return callContract<unknown>(
    client,
    ADDRESS_ALIASES.stablecoin,
    CONTRACT_LABELS.stablecoin,
    'approve',
    [spenderAlias, amount],
    from
  );
}

// Voucher writes.
// バウチャーの書き込み。
export async function buyVoucher(
  client: ReturnType<typeof getClient>,
  eventId: number,
  quantity: number,
  from: string
) {
  return callContract<unknown>(
    client,
    ADDRESS_ALIASES.voucher,
    CONTRACT_LABELS.voucher,
    'buyVoucher',
    [eventId, quantity],
    from
  );
}

export async function redeemVoucher(
  client: ReturnType<typeof getClient>,
  eventId: number,
  quantity: number,
  from: string
) {
  return callContract<unknown>(
    client,
    ADDRESS_ALIASES.voucher,
    CONTRACT_LABELS.voucher,
    'redeemVoucher',
    [eventId, quantity],
    from
  );
}
