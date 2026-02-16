import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { ethers } from 'ethers';
import { mb } from 'hardhat-multibaas-plugin/ignition';

const EVENTS = [
  { id: 1, price: '5', available: 120, name: 'Riverside_Lantern_Night' },
  { id: 2, price: '3', available: 200, name: 'Street_Food_Parade' },
  { id: 3, price: '4', available: 60, name: 'Community_Drum_Workshop' }
];

// Ignition module to deploy the demo contracts and seed events.
// デモ用コントラクトをデプロイしイベントを初期化する Ignition モジュール。
export default buildModule('MatsuriDemo', (m) => {
  const deployer = m.getAccount(0);

  const stablecoin = m.contract('MatsuriStablecoin', ['Matsuri Yen', 'MJPY', deployer]);
  const voucher = m.contract('MatsuriVoucher', [stablecoin, deployer]);

  // Link deployments to MultiBaas when MB config is provided.
  // MB 設定がある場合は MultiBaas にリンクする。
  mb.link(stablecoin, {
    contractLabel: 'matsuri_stablecoin',
    contractVersion: '1.0',
    addressAlias: 'matsuri_stablecoin'
  });
  mb.link(voucher, {
    contractLabel: 'matsuri_voucher',
    contractVersion: '1.0',
    addressAlias: 'matsuri_voucher'
  });

  for (const event of EVENTS) {
    const price = ethers.parseUnits(event.price, 18);
    m.call(voucher, 'setEvent', [event.id, price, event.available], {
      id: `MatsuriDemo_setEvent_${event.name}`
    });
  }

  return { stablecoin, voucher };
});
