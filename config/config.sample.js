// これはサンプル用コンフィグファイルです。
// コンフィグを適用するにはファイル名をconfig.jsに変えてください。
const config = {
    // BSWの標準出力に出すものを選択
    "console": {
        // チャットを標準出力に表示
        "chatLogToConsole": true,
        // 死亡ログを標準出力に表示
        "deathLogToConsole": true,
        // バックアップログを標準出力に表示
        "backupLogToConsole": true,
        // その他のBSW関係を標準出力に表示
        "bswSystemLogToConsole": true,
        // プレイヤーの参加を標準出力に表示
        "joinPlayerLogToConsole": true,
        // プレイヤーの退出を標準出力に表示
        "leavePlayerLogToConsole": true
    },
    "Discord": {
        // ディスコードBotトークン
        "TOKEN":"",
        // ディスコードを有効化するか
        "enabled":false,
        // このBOTを使うサーバーID
        "guildId": "",
        // ディスコードにBSWの情報を送信するか
        "notifications": {
            "chat": {
                // チャットを送受信するか
                "enabled": true,
                // プレイヤーの死亡を通知するか
                "playerDeath": true,
                // 送受信するチャンネルID
                "channelId": ""
            },
            "serverStatus": {
                // プレイヤー数が閾値を超えたら通知するか
                "enabled": true,
                // 通知するチャンネルID
                "channelId": ""
            },
            "toAdmin": {
                // 管理者用チャンネルID
                "channelId": "",
                // 有効化
                "enabled": true,
                
                "deathInfo": {
                    // 管理者用チャンネルからプレイヤーの死亡情報を取得できるようにするか
                    "enabled":true,
                    // プレフィックスの設定 (デフォルトだと?d Playerか?deathinfo Playerで取得)
                    "prefix": ["?d","?deathinfo"]
                },
                "playerInfo": {
                    // 管理者用チャンネルからプレイヤーの簡単な情報を取得できるようにするか
                    "enabled":true,
                    // プレフィックスの設定 (デフォルトだと?p Playerか?playerinfo Playerで取得)
                    "prefix": ["?p","?playerinfo"]
                },
                "ban": {
                    // 管理者用チャンネルからプレイヤーのBAN情報を管理する方法
                    "enabled": true,
                    "prefix": ["?b","?ban"]
                }
                
            }
        },
    },
    "backup": {
        // バックアップを有効化するかどうか
        "enabled":true,
        // 自動バックアップの間隔を設定します(分)
        "interval": 30,
        // プレイヤーが抜けたときにバックアップするかどうか
        "leavePlayerBackup": true,
        // 人がいないときに自動バックアップを止めるかどうか
        "pauseIfNoPlayer": true,
        // バックアップを自動で削除する日数(0の場合削除しない)
        "autoDeleteAfterDays": 7
    },
    "webUi": {
        // ダッシュボードを公開するポート
        "port": 3000,

        "basicAuth": {
            // ダッシュボードに認証を使用するか
            "enable": true,
            // ダッシュボードにアクセスするためのユーザーネーム
            "username":"admin",
            // ダッシュボードにアクセスするためのパスワード
            "password":"admin"
        },
        // リバースプロキシを信頼するか(boolean | number)
        "trustProxy": false
    }
}
module.exports = config