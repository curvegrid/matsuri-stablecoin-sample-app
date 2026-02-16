# DECISIONS / 決定記録

## 1) Voucher Token Type / バウチャーのトークン種別
Vouchers are ERC721 (non-transferable) so each voucher is a distinct ticket.
バウチャーは ERC721（譲渡不可）で、1枚が1チケットになるようにした。

## 2) Stablecoin Control / ステーブルコイン管理
The stablecoin is issuer-owned with `mint` and `burn` for simplicity.
発行者が `mint` / `burn` できる単純な設計にした。

## 3) Transaction Flow / トランザクションフロー
Reads and writes go through MultiBaas; writes are signed in MetaMask.
読み書きは MultiBaas を経由し、書き込みは MetaMask で署名する。

## 4) Address Alias & Contract Label / エイリアスとラベル
MultiBaas contract labels select ABI/version; address aliases map to deployed addresses.
ラベルは ABI/バージョンを選び、エイリアスが実アドレスに紐付く。

## 5) Demo Scope / デモ範囲
This is a hackathon demo, not production-ready (no access control, rate limits, or fraud checks).
ハッカソン向けの簡易デモであり、本番品質の権限制御や不正対策は未実装。
