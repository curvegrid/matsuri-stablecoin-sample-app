import { defineConfig } from 'hardhat/config';
import hardhatIgnition from '@nomicfoundation/hardhat-ignition';
import hardhatEthers from '@nomicfoundation/hardhat-ethers';
import hardhatEthersChaiMatchers from '@nomicfoundation/hardhat-ethers-chai-matchers';
import hardhatMocha from '@nomicfoundation/hardhat-mocha';
import hardhatMultibaasPlugin from 'hardhat-multibaas-plugin';
import 'dotenv/config';

// Configure Kaigan and Sepolia for deployment.
// Kaigan と Sepolia のデプロイ設定。
const mbHost = process.env.MB_HOST ?? '';

export default defineConfig({
  solidity: '0.8.33',
  plugins: [hardhatIgnition, hardhatEthers, hardhatEthersChaiMatchers, hardhatMocha, hardhatMultibaasPlugin],
  ignition: {
    requiredConfirmations: 1
  },
  networks: {
    kaigan: {
      type: 'http',
      chainType: 'l1',
      // Use web3 endpoint when configured; otherwise fall back to public RPC.
      // web3 エンドポイントがあれば優先し、なければ RPC を使う。
      url: process.env.KAIGAN_RPC_URL || 'https://rpc.kaigan.jsc.dev',
      chainId: 5_278_000,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : []
    },
    sepolia: {
      type: 'http',
      chainType: 'l1',
      // Use web3 endpoint when configured; otherwise fall back to public RPC.
      // web3 エンドポイントがあれば優先し、なければ RPC を使う。
      url: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      chainId: 11_155_111,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : []
    }
  },
  // MultiBaas admin config used by the plugin to register and link contracts.
  // コントラクト登録とリンクのための MultiBaas 管理設定。
  mbConfig: {
    apiKey: process.env.MB_ADMIN_API_KEY ?? '',
    host: mbHost,
    allowUpdateAddress: ['kaigan', 'sepolia'],
    allowUpdateContract: ['kaigan', 'sepolia'],
    syncExisting: false,
  }
});
