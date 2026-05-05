const chalk = require("chalk")
const Database = require("better-sqlite3")
const path = require("path")

const Types = {
    events: {
        BDS:"BDS",
        Chat:"chat",
        Server:"server",
        Death:"death",
        CMD:"cmd",
        PlayerJoin:"PlayerJoin",
        PlayerLeave:"PlayerLeave"
    },

    blockevents: {
        actiontype: {
            PlaceBlock:"PlaceBlock",
            BreakBlock:"BreakBlock"
        },
        dimension: {
            OverWorld:"Overworld",
            Nether:"Nether",
            TheEnd:"TheEnd"
        }
    }
}

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
        // player + type
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_events_player_time ON events(player, time);`)
        // type + time
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_events_type_time ON events(type, time);`)

        // ブロック
        // actiontypeが0はplace、1はbleak
        // dimensionの0がoverworld、1がnether、2がthe_end
        this.db.exec(`CREATE TABLE IF NOT EXISTS blockevents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actiontype INTEGER NOT NULL,
            player TEXT NOT NULL,
            time INTEGER NOT NULL,
            typeid TEXT NOT NULL,
            dimension INTEGER NOT NULL,
            x INTEGER NOT NULL,
            y INTEGER NOT NULL,
            z INTEGER NOT NULL
        );`)
        // actiontype + 時間
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_blockevents_action_time ON blockevents(actiontype, time DESC);`)
        // プレイヤー名 + 時間
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_blockevents_player_time ON blockevents(player, time DESC);`)
        // ディメンション + 座標(x,z,y)
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_blockevents_coords ON blockevents(dimension, x, z, y, time DESC);`)
        // 時間
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_blockevents_time ON blockevents(time DESC);`)
        // ブロックの種類
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_blockevents_type_time_player ON blockevents(typeid, time DESC);`)
    }
    // Events

    /**
     * 
     * @param {string} player 
     * @param {boolean} isdiscord 
     * @param {string} message 
     */
    Chat(player,isdiscord,message) {
        const prefix = isdiscord ? "[D]" :""
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.Chat,player,`${prefix}${player}:${message}`,JSON.stringify({isdiscord,player,message}))
    }
    /**
     * @param {string} line 
     */
    BDS(line) {
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.BDS,null,line,null)
    }

    
}

module.exports = {Logger,Types}