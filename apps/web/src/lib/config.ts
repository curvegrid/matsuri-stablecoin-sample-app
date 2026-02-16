// Network configuration used for wallet switching and display.
// ウォレット切替や表示に使うネットワーク設定。
export type ChainConfig = {
  key: 'kaigan' | 'sepolia';
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currencySymbol: string;
};

// Sepolia RPC can be overridden by env for teams using a paid provider.
// Sepolia RPC は必要に応じて環境変数で上書きできる。
const sepoliaRpc = import.meta.env.VITE_SEPOLIA_RPC_URL ?? 'https://rpc.sepolia.org';

// Network configs for MetaMask network switching.
// MetaMask のネットワーク切替用設定。
export const SUPPORTED_NETWORKS: ChainConfig[] = [
  {
    key: 'kaigan',
    chainId: 5_278_000,
    chainIdHex: '0x508930',
    name: 'JSC Kaigan',
    rpcUrl: 'https://rpc.kaigan.jsc.dev',
    explorerUrl: 'https://explorer.kaigan.jsc.dev',
    currencySymbol: 'JETH'
  },
  {
    key: 'sepolia',
    chainId: 11_155_111,
    chainIdHex: '0xAA36A7',
    name: 'Ethereum Sepolia',
    rpcUrl: sepoliaRpc,
    explorerUrl: 'https://sepolia.etherscan.io',
    currencySymbol: 'ETH'
  }
];

// Default network preset shown in the UI and used for "Switch Network".
// UI のデフォルトネットワークと「切替」対象。
export const DEFAULT_CHAIN_KEY = (import.meta.env.VITE_DEFAULT_CHAIN as 'kaigan' | 'sepolia') ?? 'kaigan';

// MultiBaas base URL and API key for the frontend (DApp User key).
// フロントエンド用の MultiBaas URL と API キー（DApp User）。
export const MULTIBAAS_BASE_URL = import.meta.env.VITE_MB_BASE_URL ?? '';
export const MULTIBAAS_API_KEY = import.meta.env.VITE_MB_API_KEY ?? '';

// MultiBaas contract labels are used to select a contract ABI/version.
// MultiBaas のコントラクトラベルは ABI/バージョン選択に使う。
export const CONTRACT_LABELS = {
  stablecoin: import.meta.env.VITE_STABLECOIN_CONTRACT_LABEL ?? 'matsuri_stablecoin',
  voucher: import.meta.env.VITE_VOUCHER_CONTRACT_LABEL ?? 'matsuri_voucher'
};

// Address aliases point to deployed contract addresses inside MultiBaas.
// アドレスエイリアスは MultiBaas 側のデプロイ済みアドレスを参照する。
export const ADDRESS_ALIASES = {
  stablecoin: import.meta.env.VITE_STABLECOIN_ADDRESS_ALIAS ?? 'matsuri_stablecoin',
  voucher: import.meta.env.VITE_VOUCHER_ADDRESS_ALIAS ?? 'matsuri_voucher'
};
