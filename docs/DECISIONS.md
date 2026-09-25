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
This is a hackathon demo. Contracts enforce issuer ownership, but there is no fiat backing, merchant verification, or production fraud prevention.
ハッカソン向けデモ。コントラクトで発行者権限を制御するが、法定通貨の裏付け・加盟店確認・本番向け不正対策は未実装。
