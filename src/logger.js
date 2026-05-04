const chalk = require("chalk")
const Database = require("better-sqlite3")
const path = require("path")

class Logger {
    constructor (dbpath) {
        this.db = new Database(dbpath)
        // WALモードに
        this.db.exec(`PRAGMA journal_mode = WAL;`)
        
        // イベント
        // metadataにはJSON
        this.db.exec(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time INTEGER NOT NULL,
            type TEXT NOT NULL,
            player TEXT,
            message TEXT,
            metadata TEXT
        );`);

        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);`)

        // ブロック設置
        this.db.exec(`CREATE TABLE IF NOT EXISTS placeblock (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            time INTEGER NOT NULL,
            typeid TEXT NOT NULL,
            dimension TEXT NOT NULL,
            x INTEGER NOT NULL,
            y INTEGER NOT NULL,
            z INTEGER NOT NULL
        );`)
        // プレイヤー名 + 時間
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_placeblock_player_time ON placeblock(player, time DESC);`)
        // ディメンション + 座標
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_placeblock_dimension_xyz ON placeblock(dimension, x, y, z);`)
        // 時間
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_placeblock_time ON placeblock(time DESC);`)
        // ブロックの種類
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_placeblock_type_time_player ON placeblock(typeid, time DESC);`)

        // ブロック破壊
        this.db.exec(`CREATE TABLE IF NOT EXISTS breakblock (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            time INTEGER NOT NULL,
            typeid TEXT NOT NULL,
            dimension TEXT NOT NULL,
            x INTEGER NOT NULL,
            y INTEGER NOT NULL,
            z INTEGER NOT NULL
        );`)

        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_breakblock_player_time ON breakblock(player, time DESC);`)
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_breakblock_dimension_xyz ON breakblock(dimension, x, y, z);`)
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_breakblock_time ON breakblock(time DESC);`)
    }

    addEvents() {

    }
}