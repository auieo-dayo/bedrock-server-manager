# API ドキュメント

## 1. `/api/getlog`

### 概要

サーバーログの最新300件を取得する。

### メソッド

`GET`

### レスポンス例

```json
[
  {
    "data": "Player1",
    "type": "PlayerJoin",
    "time": 1766216088127
  },
  {
    "data": "Player1:こんにちは!",
    "type": "chat",
    "time": 1766216090127
  },
  {
    "data": "NO LOG FILE! - setting up server logging...",
    "type": "BDS",
    "time": 1766216088127
  }
]
```

### フィールド

| フィールド  | 型      | 説明                                                                      |
| ------ | ------ | ----------------------------------------------------------------------- |
| `data` | string | ログ内容。テキスト形式。                                                            |
| `type` | string | ログの種類。`chat`, `death`, `PlayerJoin`, `PlayerLeave`, `BDS`, `server`, `cmd` など。 |
| `time` | number | UNIXタイムスタンプ。                                                            |

---

## 2. `/api/nowonline`

### 概要

現在サーバーに接続中のプレイヤー一覧を取得する。

### メソッド

`GET`

### レスポンス例

```json
[
  {
    "name": "Player1",
    "xuid": 2535430894533979
  },
  {
    "name": "Player2",
    "xuid": 2535469401581741
  }
]
```

### フィールド

| フィールド  | 型      | 説明         |
| ------ | ------ | ---------- |
| `name` | string | プレイヤー名。    |
| `xuid` | number | プレイヤー固有ID。 |

---

## 3. `/api/info`

### 概要

サーバー情報やBDS情報を取得する。

### メソッド

`GET`

### レスポンス例

```json
{
  "BDS": {
    "servername": "MyServer",
    "levelname": "world",
    "gamemode": "survival",
    "difficulty": "normal",
    "player": {
      "max": 10,
      "now": 2
    },
    "version": "1.21.131.1"
  },
  "server": {
    "mem": {
      "free": 7.5,
      "total": 16,
      "par": 53.125
    },
    "cpu": {
      "par": 12.3
    }
  }
}
```

### フィールド

| フィールド              | 型      | 説明              |
| ------------------ | ------ | --------------- |
| `BDS`              | object | Minecraftサーバー情報 |
| `BDS.servername`   | string | サーバー名           |
| `BDS.levelname`    | string | ワールド名           |
| `BDS.gamemode`     | string | ゲームモード          |
| `BDS.difficulty`   | string | 難易度             |
| `BDS.player.max`   | number | 最大プレイヤー数        |
| `BDS.player.now`   | number | 現在接続中のプレイヤー数    |
| `BDS.version`      | string | BDSのバージョン       |
| `server.mem.free`  | number | 空きメモリ(GB)       |
| `server.mem.total` | number | 総メモリ(GB)        |
| `server.mem.par`   | number | メモリ使用率(%)       |
| `server.cpu.par`   | number | CPU使用率(%)       |

---

## 4. `/api/backuplist`

### 概要

サーバーのバックアップ一覧を取得する。

### メソッド

`GET`

### レスポンス例

```json
{
  "allbackup": 77,
  "today": 77,
  "todaybackuplist": [
    {
      "fullpath": "2025/12/20/10-27-39",
      "date": {
        "yyyy": 2025,
        "MM": 12,
        "dd": 20,
        "hh": 10,
        "mm": 27,
        "ss": 39
      },
      "fullpathja": "2025年12月20日 10時27分39秒",
      "full": false
    },
    {
      "fullpath": "2025/12/20/23-36-49_FULL",
      "date": {
        "yyyy": 2025,
        "MM": 12,
        "dd": 20,
        "hh": 23,
        "mm": 36,
        "ss": 49
      },
      "fullpathja": "2025年12月20日 23時36分49秒 (FULL)",
      "full": true
    }
  ]
}
```

### フィールド

| フィールド                          | 型       | 説明             |
| ------------------------------ | ------- | -------------- |
| `allbackup`                    | number  | 全バックアップ件数      |
| `today`                        | number  | 今日のバックアップ件数    |
| `todaybackuplist`              | array   | 今日のバックアップ詳細リスト |
| `todaybackuplist[].fullpath`   | string  | バックアップフォルダパス   |
| `todaybackuplist[].date`       | object  | バックアップ日時       |
| `todaybackuplist[].date.yyyy`  | number  | 年              |
| `todaybackuplist[].date.MM`    | number  | 月              |
| `todaybackuplist[].date.dd`    | number  | 日              |
| `todaybackuplist[].date.hh`    | number  | 時              |
| `todaybackuplist[].date.mm`    | number  | 分              |
| `todaybackuplist[].date.ss`    | number  | 秒              |
| `todaybackuplist[].fullpathja` | string  | 日本語表記の日時       |
| `todaybackuplist[].full`       | boolean | フルバックアップかどうか   |

---

## 5. `/api/dashboard`

### 概要

ダッシュボード用に、サーバー情報、オンラインプレイヤー、バックアップリストをまとめて取得する。

### メソッド

`GET`

### レスポンス例

```json
{
  "info": {
    "BDS": {
      "servername": "MyServer",
      "levelname": "world",
      "gamemode": "survival",
      "difficulty": "normal",
      "player": {
        "max": 10,
        "now": 2
      },
      "version": "1.21.131.1"
    },
    "server": {
      "mem": {
        "free": 7.5,
        "total": 16,
        "par": 53.125
      },
      "cpu": {
        "par": 12.3
      }
    }
  },
  "onlines": [
    {
      "name": "Player1",
      "xuid": 2535430894533979
    },
    {
      "name": "Player2",
      "xuid": 2535469401581741
    }
  ],
  "backups": {
    "allbackup": 77,
    "today": 77,
    "todaybackuplist": [...]
  }
}
```

### フィールド

| フィールド    | 型     | 説明                      |
| ------- | ----- | ----------------------- |
| `info`  | object | `/api/info` と同じ形式      |
| `onlines` | array | `/api/nowonline` と同じ形式 |
| `backups` | object | `/api/backuplist` と同じ形式 |

---

## 6. `/api/getwstoken`

### 概要

WebSocket接続時に使用するトークンを取得する。

### メソッド

`GET`

### レスポンス例

```json
{
  "token": "abcd1234-efgh5678-ijkl9012"
}
```

### フィールド

| フィールド | 型     | 説明                         |
| ----- | ----- | -------------------------- |
| `token` | string | WebSocket接続に使用するトークン文字列 |

### 使用方法

取得したトークンを使用してWebSocket接続時に以下のように指定します：

```
ws://localhost:3000/ws?token=<取得したトークン>
```

---

## 7. `/api/getbdspw`

### 概要

BDSアドオンからサーバーに送信するデータを認証する際に使用するパスワードを取得する。

### メソッド

`GET`

### レスポンス例

```json
{
  "password": "unique-password-string-1234567890"
}
```

### フィールド

| フィールド    | 型     | 説明                              |
| ------- | ----- | ------------------------------- |
| `password` | string | BDS送信用パスワード（Basic Auth用） |

### 注記

- このエンドポイントは `127.0.0.1` および `::1` からのアクセスのみ許可されます
- 取得したパスワードはBDSアドオンの `/api/bds/send` エンドポイント認証に使用されます
