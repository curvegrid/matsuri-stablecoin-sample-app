import { ethers } from 'ethers';
import { TransactionToSignTx } from '@curvegrid/multibaas-sdk';

// Convert a MultiBaas transaction into an ethers.js transaction request.
// MultiBaas のトランザクションを ethers.js 用のリクエストに変換する。
export function toEthersTx(tx: TransactionToSignTx): ethers.TransactionRequest {
  const request: ethers.TransactionRequest = {
    from: tx.from,
    to: tx.to,
    data: tx.data,
    nonce: tx.nonce,
    gasLimit: tx.gas ? BigInt(tx.gas) : undefined,
    value: tx.value ? BigInt(tx.value) : undefined
  };

  // Preserve the gas fields exactly as returned by MultiBaas.
  // MultiBaas が返したガス設定をそのまま使う。
  if (tx.gasPrice) {
    request.gasPrice = BigInt(tx.gasPrice);
  }
  if (tx.gasFeeCap) {
    request.maxFeePerGas = BigInt(tx.gasFeeCap);
  }
  if (tx.gasTipCap) {
    request.maxPriorityFeePerGas = BigInt(tx.gasTipCap);
  }
  if (tx.type !== undefined) {
    request.type = tx.type;
  }
  return request;
}

// Submit a transaction with MetaMask via ethers.js.
// ethers.js 経由で MetaMask 署名送信を行う。
export async function submitWithMetaMask(tx: TransactionToSignTx): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask not available');
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const request = toEthersTx(tx);
  const response = await signer.sendTransaction(request);
  return response.hash;
}
