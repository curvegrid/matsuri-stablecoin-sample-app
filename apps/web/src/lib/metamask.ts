import { ChainConfig } from './config';

export type WalletState = {
  address: string | null;
  chainId: number | null;
  connected: boolean;
};

// Request MetaMask connection and return the first account.
// MetaMask へ接続し、先頭アカウントを返す。
export async function connectMetaMask(): Promise<string | null> {
  if (!window.ethereum) return null;
  const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
  return accounts?.[0] ?? null;
}

// Fetch current connected accounts without prompting.
// ユーザーに確認せず、接続中アカウントを取得する。
export async function getAccounts(): Promise<string[]> {
  if (!window.ethereum) return [];
  return (await window.ethereum.request({ method: 'eth_accounts' })) as string[];
}

// Fetch current chain id in decimal form.
// 現在のチェーン ID を 10 進数で取得する。
export async function getChainId(): Promise<number | null> {
  if (!window.ethereum) return null;
  const hex = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
  return hex ? Number.parseInt(hex, 16) : null;
}

// Switch or add a network in MetaMask.
// MetaMask でネットワークを切替または追加する。
export async function switchNetwork(chain: ChainConfig): Promise<void> {
  if (!window.ethereum) throw new Error('MetaMask not available');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chain.chainIdHex }]
    });
  } catch (err: unknown) {
    // Error code 4902 indicates the chain is not added yet.
    // 4902 はチェーン未追加を示す。
    const maybe = err as { code?: number };
    if (maybe?.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chain.chainIdHex,
            chainName: chain.name,
            nativeCurrency: {
              name: chain.currencySymbol,
              symbol: chain.currencySymbol,
              decimals: 18
            },
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: [chain.explorerUrl]
          }
        ]
      });
    } else {
      throw err;
    }
  }
}
