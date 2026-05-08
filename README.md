
# BSW (Bedrock Server Wrapper)

BSW は Node.js ベースの BDS (Bedrock Dedicated Server) 管理ツールです。サーバー設定の同期、ログ収集、バックアップ、自動通知、Web ダッシュボード、WebSocket コンソールなどを提供します。

ちなみにめっちゃ自分用です()

## 概要
- server.properties の同期
- チャットログ・死亡ログの収集
- Discord への通知（設定時）
- 自動バックアップ（差分）
- Web ダッシュボードと REST API
- WebSocket によるリアルタイムログ/コマンド送信

## ドキュメント
- config.js: [docs/config.md](docs/config.md)
- .env: [docs/env.md](docs/env.md)
- API: [docs/API.md](docs/API.md)
- WebSocket: [docs/Websocket.md](docs/Websocket.md)

## 必要条件
- Node.js 18 以上
- BDS（Bedrock Dedicated Server）をbds/に配置しておくこと

## セットアップ
1. 依存パッケージをインストール

```bash
npm install
```

2. BDS をダウンロードし、リポジトリルートに `bds` フォルダを置く
3. `bds/worlds/world` を作成（ワールド配置用）

## 設定
- `config.js`：BSW の動作設定（WebUI, Discord, backup 等）
詳しくは[docs/config.md](docs/config.md) を参照してください。

- `.env`：BDS の `server.properties` に対応する環境変数（`server-name`, `gamemode`, `level-name` など）
詳しくは[docs/env.md](docs/env.md) を参照してください。


（既存の README のサンプル `config.js` / `.env` 設定はこのリポジトリ内に含まれています）

## 起動

```bash
npm start
```

デフォルトでは WebUI は `config.js` の `webUi.port`（デフォルト 3000）で起動します。

## Discord コマンド

Discord Botを設定すると、以下のアプリケーションコマンド（スラッシュコマンド）が使用可能になります。

> **注記**: 一部コマンドはプレフィックス形式（`?d`, `?p`, `?b` など）にも対応しており、従来の方式での使用も可能です。

### チャットチャンネル用コマンド

#### `/pl` - プレイヤーリスト表示
現在オンラインのプレイヤー一覧を表示します。

### 管理者チャンネル用コマンド

#### `/p <gamertag>` - プレイヤー情報取得
指定したプレイヤーの情報を取得します。
- **対応プレフィックス**: `?p`, `?playerinfo`
- **例**: `/p Player1` または `?p Player1`

#### `/d <gamertag>` - 死亡ログ取得
指定したプレイヤーの直近10件の死亡ログを取得します。
- **対応プレフィックス**: `?d`, `?deathinfo`
- **例**: `/d Player1` または `?d Player1`

#### `/ban` - BAN管理
プレイヤーのBAN操作を行います。

**サブコマンド:**
- **ban `<gamertag>` `<reason>` [expired]** - プレイヤーをBANします
  - `gamertag`: 対象プレイヤーのゲーマータグ
  - `reason`: BAN理由
  - `expired` (オプション): BAN期間（時間）
  - **対応プレフィックス**: `?b ban`, `?ban ban`

- **isbanned `<gamertag>`** - プレイヤーがBANされているか確認
  - **対応プレフィックス**: `?b isbanned`, `?ban isbanned`

- **list** - BANリストを表示

- **pardon `<gamertag>`** - プレイヤーのBANを解除
  - **対応プレフィックス**: `?b pardon`, `?ban pardon`

#### `/backup` - バックアップ操作
サーバーのバックアップを管理します。

**サブコマンド:**
- **backup [isfull]** - バックアップを実行
  - `isfull` (オプション): true でフルバックアップ（デフォルト: 差分バックアップ）

- **restore `<target>`** - バックアップから復元（サーバーが一度停止します）
  - `target`: 復元対象のバックアップ（自動補完対応）

- **list** - バックアップリストを表示

#### `/block` - ブロックイベント
ブロック設置・破壊のイベントログを取得します。オプションなしでも実行可能です。

**オプション（すべてオプション）:**
- `type`: `place` (設置) または `break` (破壊)
- `player`: プレイヤー名で絞り込み
- `block`: ブロック種別で絞り込み（自動補完対応）
- `minutes`: 時間範囲で絞り込み（分単位）

**例**: 
- `/block` - 全ブロックイベント
- `/block type:place player:Player1 block:diamond_ore minutes:60` - 詳細な絞り込み

---

> このプロジェクトでは、デフォルトのWebダッシュボードに Yusei Magic フォント（SIL Open Font License 1.1）を使用しています。

> README.md、及びdocs/内のmdファイルには生成AIを使用しています