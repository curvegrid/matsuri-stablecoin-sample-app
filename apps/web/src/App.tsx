import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import type { TransactionToSignTx } from '@curvegrid/multibaas-sdk';
import { ADDRESS_ALIASES, CONTRACT_LABELS, DEFAULT_CHAIN_KEY, SUPPORTED_NETWORKS } from './lib/config';
import { connectMetaMask, getAccounts, getChainId, switchNetwork } from './lib/metamask';
import {
  approveVoucherSpend,
  buyVoucher,
  burnStablecoin,
  getClient,
  getStablecoinBalance,
  getStablecoinTotalSupply,
  getVoucherBalance,
  getVoucherEventInfo,
  mintStablecoin,
  redeemVoucher
} from './lib/contracts';
import { fetchStablecoinBalances, fetchVoucherActivity } from './lib/eventQueries';
import { submitWithMetaMask } from './lib/tx';
import { MATSURI_EVENTS } from './data/events';

const DECIMALS = 18;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

type TxStatus = {
  message: string;
  kind: 'idle' | 'pending' | 'success' | 'error';
};

type BalanceTableRow = {
  account: string;
  balance: string;
};

type VoucherTableRow = {
  eventname: string;
  buyer: string;
  eventid: string;
  quantity: string;
  timestamp: string;
  txhash: string;
};

// Main app component for the demo.
// デモ用のメインコンポーネント。
export default function App() {
  const { t, i18n } = useTranslation();

  // Wallet + network state.
  // ウォレットとネットワーク状態。
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [selectedChainKey, setSelectedChainKey] = useState(DEFAULT_CHAIN_KEY);

  // Balances and form inputs.
  // 残高とフォーム入力。
  const [stableBalance, setStableBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [voucherBalances, setVoucherBalances] = useState<Record<number, string>>({});
  const [voucherAvailability, setVoucherAvailability] = useState<Record<number, string>>({});
  const [voucherPrices, setVoucherPrices] = useState<Record<number, string>>({});
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [mintTo, setMintTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnFrom, setBurnFrom] = useState('');
  const [burnAmount, setBurnAmount] = useState('');

  // Event query table state.
  // イベントクエリのテーブル状態。
  const [balanceTable, setBalanceTable] = useState<BalanceTableRow[]>([]);
  const [voucherTable, setVoucherTable] = useState<VoucherTableRow[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // UI status flags.
  // UI 表示用の状態。
  const [txStatus, setTxStatus] = useState<TxStatus>({ kind: 'idle', message: '' });
  const [corsError, setCorsError] = useState(false);

  // Resolved network config used for switching.
  // 切替対象のネットワーク設定。
  const activeChain = useMemo(
    () => SUPPORTED_NETWORKS.find((net) => net.key === selectedChainKey) ?? SUPPORTED_NETWORKS[0],
    [selectedChainKey]
  );

  // We treat aliases as required to call MultiBaas.
  // MultiBaas 呼び出しにはエイリアス設定が必須とみなす。
  const contractsReady = Boolean(ADDRESS_ALIASES.stablecoin && ADDRESS_ALIASES.voucher);

  // Load initial wallet state and subscribe to MetaMask events.
  // 初期ウォレット状態の取得と MetaMask イベント購読。
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [accounts, currentChainId] = await Promise.all([getAccounts(), getChainId()]);
      if (!mounted) return;
      setAddress(accounts?.[0] ?? null);
      setChainId(currentChainId);
    };

    load();

    const handleAccounts = (accounts: unknown) => {
      if (!Array.isArray(accounts)) return;
      setAddress(accounts?.[0] ?? null);
    };
    const handleChain = (hex: unknown) => {
      if (typeof hex !== 'string') return;
      setChainId(Number.parseInt(hex, 16));
    };

    window.ethereum?.on?.('accountsChanged', handleAccounts);
    window.ethereum?.on?.('chainChanged', handleChain);

    return () => {
      mounted = false;
      window.ethereum?.removeListener?.('accountsChanged', handleAccounts);
      window.ethereum?.removeListener?.('chainChanged', handleChain);
    };
  }, []);

  // Refresh balances when wallet or contract readiness changes.
  // ウォレットやコントラクト設定が変わったら残高更新。
  useEffect(() => {
    if (!contractsReady) return;
    refreshBalances();
    refreshEventTables();
  }, [address, contractsReady]);

  // Load balances for stablecoin and vouchers.
  // ステーブルコインとバウチャー残高を読み込む。
  const refreshBalances = async () => {
    if (!contractsReady) return;
    setLoadingOverview(true);
    try {
      const client = getClient();
      const balanceResp = address ? await getStablecoinBalance(client, address) : { output: '0' };
      const supplyResp = await getStablecoinTotalSupply(client);

      const balances: Record<number, string> = {};
      const availability: Record<number, string> = {};
      const prices: Record<number, string> = {};
      for (const event of MATSURI_EVENTS) {
        const voucherResp = address ? await getVoucherBalance(client, address, event.id) : { output: '0' };
        balances[event.id] = formatVoucherCount(voucherResp.output ?? '0');

        const infoResp = await getVoucherEventInfo(client, event.id);
        const tuple = Array.isArray(infoResp.output) ? infoResp.output : [];
        const price = tuple[0];
        const available = tuple[1];
        prices[event.id] = formatAmount(price ?? '0');
        availability[event.id] = formatVoucherCount(available ?? '0');
      }

      setStableBalance(formatAmount(balanceResp.output ?? '0'));
      setTotalSupply(formatAmount(supplyResp.output ?? '0'));
      setVoucherBalances(balances);
      setVoucherAvailability(availability);
      setVoucherPrices(prices);
      setCorsError(false);
    } catch (err) {
      console.error(err);
      if (isCorsError(err)) {
        setCorsError(true);
      }
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load dynamic event query tables.
  // 動的イベントクエリのテーブルを読み込む。
  const refreshEventTables = async () => {
    if (!contractsReady) return;
    setLoadingBalances(true);
    setLoadingVoucher(true);

    try {
      const balanceRows = await fetchStablecoinBalances(50);
      const cleaned = balanceRows
        .filter((row) => row.account && row.account !== ZERO_ADDRESS)
        .filter((row) => BigInt(row.balance ?? '0') !== 0n)
        .map((row) => ({
          account: row.account,
          balance: row.balance ?? '0'
        }));
      setBalanceTable(cleaned);
    } catch (err) {
      console.error(err);
      if (isCorsError(err)) {
        setCorsError(true);
      }
    } finally {
      setLoadingBalances(false);
    }

    try {
      const voucherRows = await fetchVoucherActivity(20);
      setVoucherTable(voucherRows);
    } catch (err) {
      console.error(err);
      if (isCorsError(err)) {
        setCorsError(true);
      }
    } finally {
      setLoadingVoucher(false);
    }
  };

  // Format base-unit values for display.
  // 表示用に base unit を整形する。
  const formatAmount = (raw: string) => {
    try {
      return ethers.formatUnits(raw ?? '0', DECIMALS);
    } catch {
      return '0';
    }
  };

  // Voucher balances are whole numbers, no decimals.
  // バウチャー残高は整数で表示する。
  const formatVoucherCount = (raw: string) => {
    try {
      return BigInt(raw ?? '0').toString();
    } catch {
      return '0';
    }
  };

  const formatTimestamp = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const actionLabel = (row: VoucherTableRow) => {
    const name = row.eventname ?? '';
    if (name.includes('VoucherPurchased')) return t('purchase');
    if (name.includes('VoucherRedeemed')) return t('redeem');
    return t('transfer');
  };

  // Lookup event title by event id.
  // イベントIDからイベント名を引く。
  const eventNameByEventId = (eventId: string) => {
    console.log('eventId', eventId);
    const id = Number.parseInt(eventId, 10);
    const event = MATSURI_EVENTS.find((item) => item.id === id);
    if (!event) return '-';
    return i18n.language === 'ja' ? event.title.ja : event.title.en;
  };

  const isLoadingPrice = (eventId: number) => loadingOverview && voucherPrices[eventId] === undefined;
  const isLoadingAvailable = (eventId: number) => loadingOverview && voucherAvailability[eventId] === undefined;
  const isLoadingBalance = (eventId: number) => loadingOverview && voucherBalances[eventId] === undefined;

  // Convert user input to base units for contract calls.
  // 入力値を base unit に変換する。
  const toUnits = (value: string) => {
    if (!value) return '0';
    return ethers.parseUnits(value, DECIMALS).toString();
  };

  // Poll for transaction inclusion for up to 20 seconds.
  // 最大20秒までトランザクションの取り込みを監視する。
  const pollTransaction = async (hash: string) => {
    if (!window.ethereum) return false;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const started = Date.now();
    while (Date.now() - started < 20000) {
      try {
        const receipt = await provider.getTransactionReceipt(hash);
        if (receipt) {
          return receipt.status === 1;
        }
      } catch {
        // Ignore polling errors and retry.
        // 取得エラーは無視して再試行。
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  };

  // Wallet connection handler.
  // ウォレット接続処理。
  const handleConnect = async () => {
    const account = await connectMetaMask();
    setAddress(account);
    setChainId(await getChainId());
  };

  // Network switch handler.
  // ネットワーク切替処理。
  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork(activeChain);
      setChainId(await getChainId());
    } catch (err) {
      console.error(err);
    }
  };

  // Issuer actions.
  // 発行者の操作。
  const handleMint = async () => {
    if (!mintTo || !mintAmount || !contractsReady || !address) return;
    await submitContractTx(() => mintStablecoin(getClient(), mintTo, toUnits(mintAmount), address));
  };

  const handleBurn = async () => {
    if (!burnFrom || !burnAmount || !contractsReady || !address) return;
    await submitContractTx(() => burnStablecoin(getClient(), burnFrom, toUnits(burnAmount), address));
  };

  // Voucher market actions.
  // バウチャー市場の操作。
  const handleApprove = async (eventId: number, price: string) => {
    if (!address || !contractsReady) return;
    await submitContractTx(() => approveVoucherSpend(getClient(), ADDRESS_ALIASES.voucher, toUnits(price), address));
  };

  const handleBuy = async (eventId: number, price: string) => {
    if (!address || !contractsReady) return;
    await submitContractTx(() => buyVoucher(getClient(), eventId, 1, address));
  };

  const handleRedeem = async (eventId: number) => {
    if (!address || !contractsReady) return;
    await submitContractTx(() => redeemVoucher(getClient(), eventId, 1, address));
  };

  // Centralized transaction flow: build via MultiBaas, sign in MetaMask, then refresh.
  // MultiBaas で tx を作成し MetaMask 署名後に更新する共通処理。
  const submitContractTx = async (builder: () => Promise<{ tx?: TransactionToSignTx }>) => {
    if (!address || !contractsReady) return;
    setTxStatus({ kind: 'pending', message: t('txPending') });
    try {
      const resp = await builder();
      const tx = resp.tx as Parameters<typeof submitWithMetaMask>[0] | undefined;
      if (!tx) {
        throw new Error('No transaction returned');
      }
      const hash = await submitWithMetaMask(tx);
      setTxStatus({ kind: 'success', message: `${t('txSubmitted')}: ${hash}` });
      const confirmed = await pollTransaction(hash);
      if (confirmed) {
        await refreshBalances();
        await refreshEventTables();
      } else {
        await refreshBalances();
        await refreshEventTables();
      }
    } catch (err) {
      console.error(err);
      if (isCorsError(err)) {
        setCorsError(true);
      }
      setTxStatus({ kind: 'error', message: t('txFailed') });
    }
  };

  // Heuristic to surface CORS misconfiguration to the user.
  // CORS 設定不足を検知するための簡易判定。
  const isCorsError = (err: unknown) => {
    if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) return true;
    const message = (err as { message?: string })?.message?.toLowerCase() ?? '';
    return message.includes('cors');
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">MultiBaas + Stablecoin</p>
          <h1>{t('appName')}</h1>
          <p className="tagline">{t('tagline')}</p>
        </div>
        <div className="controls">
          <div className="pill">
            <span>{t('language')}</span>
            <button onClick={() => i18n.changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>
              EN
            </button>
            <button onClick={() => i18n.changeLanguage('ja')} className={i18n.language === 'ja' ? 'active' : ''}>
              JP
            </button>
          </div>
          <div className="pill">
            <span>{t('network')}</span>
            <select value={selectedChainKey} onChange={(e) => setSelectedChainKey(e.target.value as 'awaji' | 'sepolia')}>
              {SUPPORTED_NETWORKS.map((net) => (
                <option key={net.key} value={net.key}>
                  {net.name}
                </option>
              ))}
            </select>
            <button onClick={handleSwitchNetwork}>{t('switchNetwork')}</button>
          </div>
          <div className="pill">
            <span>{t('wallet')}</span>
            {address ? (
              <span className="status ok">{t('connected')}</span>
            ) : (
              <span className="status warn">{t('notConnected')}</span>
            )}
            <button onClick={handleConnect}>{t('connectWallet')}</button>
          </div>
        </div>
      </header>

      <section className="status-grid">
        <div className="status-card">
          <h3>{t('contractStatus')}</h3>
          <p>{contractsReady ? t('contractsReady') : t('contractsMissing')}</p>
        </div>
        <div className="status-card">
          <h3>{t('network')}</h3>
          <p>{chainId ? `#${chainId}` : t('loading')}</p>
        </div>
        <div className="status-card">
          <h3>{t('yourBalance')}</h3>
          <p>{loadingOverview ? t('loading') : stableBalance}</p>
        </div>
        <div className="status-card">
          <h3>{t('totalSupply')}</h3>
          <p>{loadingOverview ? t('loading') : totalSupply}</p>
        </div>
      </section>

      {txStatus.kind !== 'idle' && (
        <section className={`banner ${txStatus.kind}`}>
          <span>{txStatus.message}</span>
        </section>
      )}
      {corsError && (
        <section className="banner error">
          <strong>{t('corsTitle')}</strong>
          <span>{t('corsBody')}</span>
        </section>
      )}

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <h2>{t('issuerDashboard')}</h2>
            <p>{t('issuerNote')}</p>
          </div>
          <div className="form-grid">
            <label>
              {t('recipient')}
              <input value={mintTo} onChange={(e) => setMintTo(e.target.value)} placeholder="0x..." />
            </label>
            <label>
              {t('amount')}
              <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="0.0" />
            </label>
            <button onClick={handleMint}>{t('mint')}</button>
          </div>
          <div className="form-grid">
            <label>
              {t('recipient')}
              <input value={burnFrom} onChange={(e) => setBurnFrom(e.target.value)} placeholder="0x..." />
            </label>
            <label>
              {t('amount')}
              <input value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} placeholder="0.0" />
            </label>
            <button onClick={handleBurn}>{t('burn')}</button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>{t('matsuriMarket')}</h2>
            <p>{t('marketNote')}</p>
          </div>
          <div className="cards">
            {MATSURI_EVENTS.map((event) => (
              <article key={event.id} className="card">
                <div>
                  <h3>{i18n.language === 'ja' ? event.title.ja : event.title.en}</h3>
                  <p>{i18n.language === 'ja' ? event.description.ja : event.description.en}</p>
                </div>
                <div className="card-meta">
                  <span>
                    {t('price')}: {isLoadingPrice(event.id) ? t('loading') : (voucherPrices[event.id] ?? event.price)}
                  </span>
                  <span>
                    {t('available')}: {isLoadingAvailable(event.id) ? t('loading') : (voucherAvailability[event.id] ?? event.available)}
                  </span>
                  <span>
                    {t('voucherBalance')}: {isLoadingBalance(event.id) ? t('loading') : (voucherBalances[event.id] ?? '0')}
                  </span>
                </div>
                <div className="card-actions">
                  <button onClick={() => handleApprove(event.id, event.price)}>{t('approve')}</button>
                  <button onClick={() => handleBuy(event.id, event.price)}>{t('buyVoucher')}</button>
                  <button onClick={() => handleRedeem(event.id)}>{t('redeemVoucher')}</button>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>

      <section className="full-stack">
        <section className="panel">
          <div className="panel-header">
            <h2>{t('stablecoinBalances')}</h2>
            <p>{loadingBalances ? t('loading') : ''}</p>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('address')}</th>
                  <th className="num">{t('balance')}</th>
                </tr>
              </thead>
              <tbody>
                {loadingBalances && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <tr key={`loading-balance-${i}`}>
                        <td><span className="skeleton skeleton-text" /></td>
                        <td className="num"><span className="skeleton skeleton-text" /></td>
                      </tr>
                    ))}
                  </>
                )}
                {!loadingBalances && balanceTable.length === 0 && (
                  <tr>
                    <td colSpan={2}>{t('noData')}</td>
                  </tr>
                )}
                {!loadingBalances &&
                  balanceTable.map((row) => (
                    <tr key={row.account}>
                      <td className="mono">{row.account}</td>
                      <td className="num">{formatAmount(row.balance)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>{t('voucherActivity')}</h2>
            <p>{loadingVoucher ? t('loading') : ''}</p>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('action')}</th>
                  <th>{t('voucherTitle')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('buyer')}</th>
                  <th>{t('timestamp')}</th>
                </tr>
              </thead>
              <tbody>
                {loadingVoucher && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <tr key={`loading-voucher-${i}`}>
                        <td><span className="skeleton skeleton-text" /></td>
                        <td><span className="skeleton skeleton-text" /></td>
                        <td><span className="skeleton skeleton-text" /></td>
                        <td><span className="skeleton skeleton-text" /></td>
                        <td><span className="skeleton skeleton-text" /></td>
                      </tr>
                    ))}
                  </>
                )}
                {!loadingVoucher && voucherTable.length === 0 && (
                  <tr>
                    <td colSpan={6}>{t('noData')}</td>
                  </tr>
                )}
                {!loadingVoucher &&
                  voucherTable.map((row) => (
                    <tr key={`${row.txhash}-${row.timestamp}`}>
                      <td>{actionLabel(row)}</td>
                      <td>{eventNameByEventId(row.eventid)}</td>
                      <td>{row.quantity}</td>
                      <td className="mono">{row.buyer}</td>
                      <td>{formatTimestamp(row.timestamp)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <footer className="footer">
        <button
          onClick={() => {
            refreshBalances();
            refreshEventTables();
          }}
        >
          {t('refresh')}
        </button>
        <span>Chain preset: {activeChain.name}</span>
      </footer>
    </div>
  );
}
