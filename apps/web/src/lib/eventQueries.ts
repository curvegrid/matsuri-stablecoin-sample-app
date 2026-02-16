import * as MultiBaas from '@curvegrid/multibaas-sdk';
import { ADDRESS_ALIASES } from './config';
import { createEventQueriesClient } from './multibaas';

export type BalanceRow = {
  account: string;
  balance: string;
};

export type VoucherActivityRow = {
  eventname: string;
  buyer: string;
  eventId: string;
  quantity: string;
  timestamp: string;
  txhash: string;
  eventid: string;
};

// Build a dynamic event query that computes net balances from ERC20 Transfer events.
// ERC20 Transfer イベントを add/subtract 集計し、残高を算出する動的クエリ。
export async function fetchStablecoinBalances(limit = 50): Promise<BalanceRow[]> {
  const api = createEventQueriesClient();

  const query: MultiBaas.EventQuery = {
    events: [
      {
        eventName: 'Transfer',
        select: [
          { type: 'input', inputIndex: 1, alias: 'account' },
          { type: 'input', inputIndex: 2, alias: 'balance', aggregator: 'add' }
        ],
        filter: {
          fieldType: 'contract_address_alias',
          operator: 'equal',
          value: ADDRESS_ALIASES.stablecoin
        }
      },
      {
        eventName: 'Transfer',
        select: [
          { type: 'input', inputIndex: 0, alias: 'account' },
          { type: 'input', inputIndex: 2, alias: 'balance', aggregator: 'subtract' }
        ],
        filter: {
          fieldType: 'contract_address_alias',
          operator: 'equal',
          value: ADDRESS_ALIASES.stablecoin
        }
      }
    ],
    groupBy: 'account',
    orderBy: 'balance',
    order: 'DESC'
  };

  const resp = await api.executeArbitraryEventQuery(query, 0, limit);
  return (resp.data.result?.rows ?? []) as BalanceRow[];
}

// Build a dynamic event query for voucher activity using VoucherPurchased/Redeemed events.
// VoucherPurchased/Redeemed イベントでバウチャー履歴を取得する。
export async function fetchVoucherActivity(limit = 50): Promise<VoucherActivityRow[]> {
  const api = createEventQueriesClient();

  const query: MultiBaas.EventQuery = {
    events: [
      {
        eventName: 'VoucherPurchased',
        select: [
          { type: 'event_signature', alias: 'eventName' },
          { type: 'input', inputIndex: 0, alias: 'buyer' },
          { type: 'input', inputIndex: 1, alias: 'eventId' },
          { type: 'input', inputIndex: 2, alias: 'quantity' },
          { type: 'triggered_at', alias: 'timestamp' },
          { type: 'tx_hash', alias: 'txhash' }
        ],
        filter: {
          fieldType: 'contract_address_alias',
          operator: 'equal',
          value: ADDRESS_ALIASES.voucher
        }
      },
      {
        eventName: 'VoucherRedeemed',
        select: [
          { type: 'event_signature', alias: 'eventName' },
          { type: 'input', inputIndex: 0, alias: 'buyer' },
          { type: 'input', inputIndex: 1, alias: 'eventId' },
          { type: 'input', inputIndex: 2, alias: 'quantity' },
          { type: 'triggered_at', alias: 'timestamp' },
          { type: 'tx_hash', alias: 'txhash' }
        ],
        filter: {
          fieldType: 'contract_address_alias',
          operator: 'equal',
          value: ADDRESS_ALIASES.voucher
        }
      }
    ],
    orderBy: 'timestamp',
    order: 'DESC'
  };

  const resp = await api.executeArbitraryEventQuery(query, 0, limit);
  return (resp.data.result?.rows ?? []) as VoucherActivityRow[];
}
