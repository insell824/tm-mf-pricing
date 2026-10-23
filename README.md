# Moneyforward Pricing - Tampermonkey Script

マネーフォワード クラウドの各サービス画面に、料金プランを表示する Tampermonkey ユーザースクリプトです。

画面上部の中央に `🐒 料金` ボタンが表示されます。

- 🐒 料金: 開いているサービスの料金プランをモーダルで表示します

モーダルでは、ひとり法人 / スモールビジネス / ビジネス の各プランについて、基本料金・アカウント数・追加料金などを表で確認できます。

## インストール

1. ブラウザに [Tampermonkey](https://www.tampermonkey.net/) を入れます
2. 次のリンクを開き、Tampermonkey のインストール画面でインストールします

   https://github.com/insell824/tm-mf-pricing/raw/refs/heads/main/release/tm-mf-pricing.latest.user.js

特定のバージョンを使う場合は `release/tm-mf-pricing.{version}.user.js` を開いてください。

## 対応サービス

| サービス             | ホスト                            |
| -------------------- | --------------------------------- |
| クラウド会計         | accounting.moneyforward.com       |
| クラウド請求書       | invoice.moneyforward.com          |
| クラウド経費         | expense.moneyforward.com          |
| クラウド債務支払     | payable.moneyforward.com          |
| クラウド勤怠         | attendance.moneyforward.com       |
| クラウド給与         | payroll.moneyforward.com          |
| クラウド年末調整     | tax-adjustment.moneyforward.com   |
| クラウド社会保険     | social-insurance.moneyforward.com |
| クラウドマイナンバー | mynumber.moneyforward.com         |
| クラウド人事管理     | employee.moneyforward.com         |
| クラウド契約         | contract.moneyforward.com         |
| クラウドBox          | box.moneyforward.com              |

料金は [マネーフォワード クラウドの料金ページ](https://biz.moneyforward.com/price/) をもとにした税抜価格です。最新の情報は公式ページで確認してください。

## 開発

Node.js 24 以上と pnpm が必要です。

```sh
pnpm install
```

| コマンド             | 内容                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm run dev`       | `src/` を監視し、`release/tm-mf-pricing.debug.user.js` を出力                              |
| `pnpm run build`     | `release/tm-mf-pricing.latest.user.js` と `release/tm-mf-pricing.{version}.user.js` を出力 |
| `pnpm run typecheck` | 型チェック                                                                                 |

### 構成

```
header.user.js      ユーザースクリプトのヘッダー（{{version}} はビルド時に置換）
scripts/build.ts    ビルドスクリプト
src/main.ts         ホスト名からサービスを判定
src/pricing.ts      料金データ
src/ui.ts           ボタンとモーダル
release/            ビルド済みスクリプト
```

### デバッグ

`pnpm run dev` で出力される `tm-mf-pricing.debug.user.js` を Tampermonkey に登録します。スクリプト名の末尾に `(debug)` が付くため、リリース版と並べて使えます。

debug 版はコンソールに判定結果を出力します。

```
[tm-mf-pricing] host=invoice.moneyforward.com matched=invoice
```

### リリース

1. `package.json` の `version` を更新します
2. `pnpm run build` を実行します
3. `release/` の生成ファイルをコミットします

## 注意

このスクリプトは非公式です。株式会社マネーフォワードとは関係ありません。
