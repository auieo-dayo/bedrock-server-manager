
## WebSocketの仕様

* URL: `ws://localhost:3000/ws`
* データ形式: JSON
* 受信データ:

```json
{
  "type": "chat | death | PlayerJoin | PlayerLeave | BDS | server",
  "data": "ログ内容（テキスト形式）"
}
```

* `time` は付与されません
* APIとの互換性は `type` と `data` で保持されます

### コマンド送信

サーバーにコマンドを送る場合：

```json
{
  "type": "cmd",
  "data": "say hello"
}
```

* `type`: `cmd`
* `data`: 実行するコマンド文字列