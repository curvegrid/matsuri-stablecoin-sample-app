# まつりステーブルコイン デモ / Matsuri (Festival) Stablecoin Demo

## (JA) 概要

軽量なブロックチェーンサンプルアプリケーションです。中央発行の地域ステーブルコインを使って、地元まつりのバウチャー（NFT）を購入するフロントアプリを提供します。

本サンプルでは **[MultiBaas](https://docs.curvegrid.com/ja/multibaas/) がバックエンドとして必須** です。フロントエンドは MultiBaas API および Event Queries を利用し、MetaMask で署名を行います。

## (EN) Overview

A lightweight blockchain sample application. It provides a frontend app where a centrally issued regional stablecoin is used to purchase local matsuri (festival) vouchers (NFTs).

**[MultiBaas](https://docs.curvegrid.com/multibaas/) is required** in this sample architecture. The frontend uses MultiBaas APIs and Event Queries, and transactions are signed with MetaMask.

---

## 構成 / Structure

- `apps/web`: Vite + React + i18next frontend
- `contracts`: Hardhat + Solidity contracts

---

## 実行手順（必読）  
## Setup Instructions (Required Reading)

このサンプルは以下の順番でセットアップします：

1. [MultiBaas デプロイメントを作成](https://docs.curvegrid.com/ja/multibaas/getting-started/account-and-deployment)
2. コントラクトをデプロイ（MultiBaas 連携必須）  
3. フロントエンドを設定  
4. CORS を設定  
5. フロントエンドを起動  

MultiBaas はオプションではありません。本アーキテクチャではバックエンドとして必須です。

---

You must complete setup in this order:

1. [Create a MultiBaas deployment](https://docs.curvegrid.com/multibaas/getting-started/account-and-deployment)
2. Deploy contracts (MultiBaas linking required)  
3. Configure the frontend  
4. Configure CORS  
5. Run the frontend  

MultiBaas is not optional: it acts as the backend for the application.

---

### Step 1: MultiBaas デプロイメント作成  
### Step 1: Create a MultiBaas Deployment

日本語ドキュメント:  
https://docs.curvegrid.com/ja/multibaas/getting-started/account-and-deployment  

English documentation:  
https://docs.curvegrid.com/multibaas/getting-started/account-and-deployment  

デプロイメントが正常に稼働していることを確認してください。

Ensure your deployment is running before proceeding.

---

### Step 2: コントラクトのデプロイ（MultiBaas 連携必須）  
### Step 2: Deploy Contracts (MultiBaas Linking Required)

```bash
cd contracts
cp .env.example .env
```

`contracts/.env` に以下を設定します:

- `DEPLOYER_KEY`
- RPC URL（Kaigan または Sepolia）
- `MB_HOST`
- `MB_WEB3_KEY`
- `MB_ADMIN_API_KEY`

⚠ 本サンプルでは MultiBaas へのリンクは必須です。

```bash
npm install
npm run deploy -- --network kaigan
```

または:

```bash
npm run deploy:kaigan
npm run deploy:sepolia
```

デプロイ後、以下を確認してください:

- コントラクトが MultiBaas に登録済み
- ABI がアップロード済み
- デプロイ済みアドレスが contract label にリンク済み

---

Configure the following in `contracts/.env`:

- `DEPLOYER_KEY`
- RPC URL (Kaigan or Sepolia)
- `MB_HOST`
- `MB_WEB3_KEY`
- `MB_ADMIN_API_KEY`

⚠ Contract linking to MultiBaas is required in this sample.

After deployment, verify:

- Contracts are registered in MultiBaas  
- ABI is uploaded  
- Deployed addresses are linked to contract labels  

---

### Step 3: フロントエンド設定  
### Step 3: Configure the Frontend

```bash
cd apps/web
cp .env.example .env
```

`apps/web/.env` に以下を設定:

- `VITE_MB_BASE_URL`
- `VITE_MB_API_KEY`（MultiBaas の `DApp User` グループで発行）
- contract label
- address alias

```bash
npm install
npm run dev
```

---

Configure in `apps/web/.env`:

- `VITE_MB_BASE_URL`
- `VITE_MB_API_KEY` (create under the `DApp User` group in MultiBaas)
- Contract labels
- Address aliases

Then:

```bash
npm install
npm run dev
```

---

### CORS 設定（ローカル開発時に必須）  
### CORS Configuration (Required for Local Development)

MultiBaas は本アプリのバックエンドです。

ローカルで実行する場合、MultiBaas 側で [CORS Origins を設定して](https://docs.curvegrid.com/ja/multibaas/getting-started/build-a-frontend#cors-origin)ください。

例:

```
http://localhost:5173
```

フロントエンドが使用するポート番号に合わせて設定してください。

---

When running locally, add your frontend origin in [MultiBaas CORS settings](https://docs.curvegrid.com/multibaas/getting-started/build-a-frontend#cors-origin), for example:

```
http://localhost:5173
```

Use whatever port your frontend exposes.

---

## 利用している MultiBaas 機能  
## MultiBaas Features Used

- [REST API](https://docs.curvegrid.com/multibaas/api/multibaas-api  ) / [TypeScript SDK](https://docs.curvegrid.com/multibaas/sdks)
- [Smart contract function calling](https://docs.curvegrid.com/multibaas/api/call-contract-function)
- [Event Queries (event indexing)](https://docs.curvegrid.com/multibaas/event-indexing)
- [Contract library + address linking](https://docs.curvegrid.com/multibaas/manage-contracts)
- [Web UI for management](https://docs.curvegrid.com/multibaas/manage-contracts#interacting-with-smart-contracts)

---

## 改造のヒント  
## Modification Tips
1. `apps/web/src/data/events.ts` の静的イベントをオンチェーンの `eventInfo` 読み取りに置き換える。  
   Replace the static events list in `apps/web/src/data/events.ts` with on-chain `eventInfo` reads.
2. 自治体がイベント管理、加盟店が利用処理できるようロールを追加する。  
   Add roles so a municipality can manage events while merchants can redeem vouchers.
3. 混雑時に価格が変わるよう価格オラクルや動的価格を追加する。  
   Add a price oracle or dynamic pricing for peak-time matsuri demand.
4. 画像・場所・日程などのメタデータを追加し、IPFS や DB に保存する。  
   Add event metadata (images, location, schedule) and store it in IPFS or a database.
5. 緊急時に販売停止や供給調整ができる管理 UI を追加する。  
   Add a simple admin UI to pause sales or adjust supply in emergencies.

---

## ハッカソン案  
## Hackathon Project Ideas
1. 商店街向けの地域ポイントとステーブルコインのハイブリッド。  
   Regional points + stablecoin hybrid for local shopping streets.
2. 食料や避難に限定した災害支援バウチャー。  
   Disaster relief vouchers that can only be redeemed for food or shelter.
3. エコ行動でバウチャーがもらえるカーボン削減報酬。  
   Carbon-reduction rewards where users earn vouchers for eco actions.
4. 若者向け職業体験で使えるコミュニティ講座クレジット。  
   Youth employment credits redeemable at community skill workshops.
5. 交通・イベント・食事を束ねた地域観光パス。  
   Local tourism pass that bundles transport + events + dining vouchers.

---

## アーキテクチャ  
## Architecture

フロントエンドが MultiBaas と通信し、未署名トランザクションを生成します。MetaMask が署名し、ブラウザが送信します。

contract label は ABI/バージョン指定、address alias はデプロイ済みアドレス参照に使用されます。

Ignition の `mb.link` を利用すると自動リンクされます。

---

The frontend communicates with MultiBaas to generate unsigned transactions. MetaMask signs them and the browser submits them.

Contract labels select ABI/version in MultiBaas. Address aliases point to deployed addresses.

Using `mb.link` in Ignition enables automatic linking.

---

## コントラクト概要  
## Contracts

- `MatsuriStablecoin.sol`: issuer-controlled ERC20 (`mint`, `burn`)  
- `MatsuriVoucher.sol`: ERC721 vouchers purchasable with the stablecoin  

---

## 注意  
## Notes

本プロジェクトはハッカソン向けデモです。本番環境向けのセキュリティ対策（レート制限、管理者認証、不正防止等）は簡略化されています。

This is a hackathon demo. Production-grade security controls (rate limiting, admin auth, fraud prevention, etc.) are simplified or omitted.

---

## ネットワーク設定  
## Network Presets

Kaigan:

- chainId `5278000`  
- RPC `https://rpc.kaigan.jsc.dev`  
- Explorer `https://explorer.kaigan.jsc.dev`  
- Currency `JETH`  

Sepolia:

- `https://rpc.sepolia.org`

---

## License

MIT License  
Copyright (c) 2026 Curvegrid Inc.
