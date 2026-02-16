export type MatsuriEvent = {
  id: number;
  title: { en: string; ja: string };
  description: { en: string; ja: string };
  // Price in stablecoin units, used as the on-chain price.
  // ステーブルコイン建ての価格（オンチェーン価格に使用）。
  price: string;
  // Inventory shown in the UI (on-chain availability is tracked in the contract).
  // UI 表示用の在庫数（オンチェーンの在庫はコントラクトで管理）。
  available: number;
};

// Local matsuri events for the voucher market.
// 地域まつり向けのイベント一覧。
export const MATSURI_EVENTS: MatsuriEvent[] = [
  {
    id: 1,
    title: { en: 'Riverside Lantern Night', ja: '川辺ランタンナイト' },
    description: {
      en: 'Lantern craft + riverside performance voucher.',
      ja: 'ランタン作りと川辺パフォーマンスのバウチャー。'
    },
    price: '5',
    available: 120
  },
  {
    id: 2,
    title: { en: 'Street Food Parade', ja: '屋台フードパレード' },
    description: {
      en: 'Voucher for 3 local stalls at the parade.',
      ja: '地元屋台3店舗の引換バウチャー。'
    },
    price: '3',
    available: 200
  },
  {
    id: 3,
    title: { en: 'Community Drum Workshop', ja: '太鼓ワークショップ' },
    description: {
      en: '90-minute taiko workshop ticket.',
      ja: '90分の太鼓ワークショップ参加券。'
    },
    price: '4',
    available: 60
  }
];
