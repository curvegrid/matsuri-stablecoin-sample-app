# AGENTS.md

## Purpose / 目的
EN: Help autonomous agents quickly navigate and extend this demo repo for hackathons.
JP: ハッカソン向けデモを自動エージェントが素早く理解・拡張できるようにする。

## Repo Map / 構成
- `apps/web`: Vite + React frontend
- `contracts`: Hardhat + Solidity contracts
- `README.md`: Setup, architecture, and hackathon ideas
- `docs/DECISIONS.md`: Design choices
- `scripts/doctor.ts`: Setup checker

## Quick Start (Agent) / クイックスタート
EN:
1. Read `README.md` for setup and architecture.
2. Update `apps/web/.env` for MultiBaas and contract aliases.
3. Run `npm install` and `npm run dev` inside `apps/web`.
4. Deploy with Ignition; MultiBaas auto-link runs when MB config is set: `npm run deploy -- --network kaigan`.
5. Shortcuts: `npm run deploy:kaigan` and `npm run deploy:sepolia`.
6. (Optional) `npm run deploy:list` to list Ignition deployments.
7. (Optional) `npm run deploy:reset:kaigan` (delete Kaigan deployment folder).
8. (Optional) `npm run deploy:reset:sepolia` (delete Sepolia deployment folder).
9. (Optional) `npm run deploy:reset:all` (delete all Ignition deployments).
10. (Optional) `npm run deploy:reset:latest` to wipe all futures in the latest deployment.
11. (Optional) `npm run deploy:reset:latest:kaigan`.
12. (Optional) `npm run deploy:reset:latest:sepolia`.
5. (Optional) Deploy via MultiBaas script: `npm run deploy:multibaas -- --network kaigan`.
6. (Optional) `npm run deploy:list` to list Ignition deployments.
7. (Optional) `npm run deploy:reset -- <deploymentId> <futureId>` to wipe a deployment future.

JP:
1. `README.md` でセットアップとアーキテクチャを確認。
2. `apps/web/.env` に MultiBaas とコントラクト設定を反映。
3. `apps/web` で `npm install` と `npm run dev`。
4. `contracts` で `npm run deploy -- --network kaigan` を実行（Ignition。MB 設定があれば自動リンク）。
5. ショートカット: `npm run deploy:kaigan` と `npm run deploy:sepolia`。
6. （任意）`npm run deploy:list` で Ignition デプロイ一覧を表示。
7. （任意）`npm run deploy:reset:kaigan`（Kaigan のデプロイフォルダ削除）。
8. （任意）`npm run deploy:reset:sepolia`（Sepolia のデプロイフォルダ削除）。
9. （任意）`npm run deploy:reset:all`（全デプロイフォルダ削除）。
10. （任意）`npm run deploy:reset:latest` で最新デプロイの future を一括リセット。
11. （任意）`npm run deploy:reset:latest:kaigan`。
12. （任意）`npm run deploy:reset:latest:sepolia`。

## Key Files / 重要ファイル
- `apps/web/src/App.tsx`: Main UI and flows (issuer + voucher market)
- `apps/web/src/lib/multibaas.ts`: MultiBaas SDK wrapper
- `apps/web/src/lib/eventQueries.ts`: Event query helpers
- `apps/web/src/lib/metamask.ts`: MetaMask connect/switch logic
- `apps/web/src/lib/config.ts`: Env config + network presets
- `apps/web/src/data/events.ts`: Static matsuri events
- `contracts/contracts/MatsuriStablecoin.sol`: ERC20 stablecoin
- `contracts/contracts/MatsuriVoucher.sol`: ERC721 voucher contract
- `contracts/scripts/deploy.ts`: Deploy script (with MultiBaas plugin support)
- `contracts/ignition/modules/MatsuriDemo.ts`: Ignition deployment module

## Data Flow / データフロー
EN: UI -> MultiBaas (build tx) -> MetaMask (sign) -> Chain. Reads also go through MultiBaas.
JP: UI -> MultiBaas（tx生成）-> MetaMask（署名）-> チェーン。読み取りも MultiBaas 経由。

## MultiBaas Features Used / 利用した機能
1. REST API and TypeScript SDK for contract calls and unsigned tx composition.
1. コントラクト呼び出しと未署名 tx 生成に REST API と TypeScript SDK を使用。
2. CORS configuration in the MultiBaas UI so the frontend can call the API directly.
2. フロントエンドから直接 API を呼ぶための CORS 設定。
3. Event Queries (Event Indexing) to compute balances and activity tables.
3. 残高や履歴テーブルのための Event Queries（イベントインデックス）。

Reference links:
```
https://docs.curvegrid.com/multibaas/api/multibaas-api
https://docs.curvegrid.com/multibaas/sdks/
https://docs.curvegrid.com/multibaas/getting-started/build-a-frontend/
https://docs.curvegrid.com/multibaas/event-indexing/
```

## Other MultiBaas Features / その他の機能
1. Webhooks for event.emitted or transaction.included notifications.
1. event.emitted や transaction.included の Webhook 通知。
2. Cloud Wallets + Transaction Manager (TXM) for backend signing and monitoring.
2. バックエンド署名と監視のための Cloud Wallets + TXM。
3. Type conversions to format function/event values in the UI.
3. 関数/イベント値の表示調整のための型変換。
4. Web UI for contract library, linking addresses, and on-chain introspection.
4. コントラクト登録、アドレス紐付け、オンチェーン参照の Web UI。
5. Go SDK for backend services.
5. バックエンド向け Go SDK。

Reference links:
```
https://docs.curvegrid.com/multibaas/api/webhooks
https://docs.curvegrid.com/multibaas/getting-started/build-a-backend/
https://docs.curvegrid.com/multibaas/txm/
https://docs.curvegrid.com/multibaas/manage-contracts
https://docs.curvegrid.com/multibaas/sdks/
https://pkg.go.dev/github.com/curvegrid/multibaas-sdk-go
```

## Common Changes / よくある変更
EN:
- Replace static events with on-chain reads (`eventInfo`).
- Add issuer/merchant roles to voucher redemption.
- Add more voucher metadata (IPFS, DB, or a simple JSON file).

JP:
- 静的イベントをオンチェーン読取に置き換える。
- 発行者/加盟店のロールを追加する。
- バウチャーのメタデータを追加する（IPFS/DB/JSON）。

## MultiBaas Notes / MultiBaas 注意点
EN: Ensure CORS is set in MultiBaas UI: Admin > CORS Origins.
JP: MultiBaas UI の Admin > CORS Origins に Origin を追加。

## Tests / テスト
EN: No automated tests included. Add unit tests in `contracts/test` if needed.
JP: 自動テストは未追加。必要なら `contracts/test` に追加。

## Output Format / 出力スタイル
EN: Keep all new comments bilingual (English + Japanese, two lines).
JP: 追加コメントは英語と日本語の2行にする。

## License / ライセンス
EN: MIT License. Copyright (c) 2026 Curvegrid Inc.
JP: MIT ライセンス。Copyright (c) 2026 Curvegrid Inc.
