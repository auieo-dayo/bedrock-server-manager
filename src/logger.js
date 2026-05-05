const Database = require("better-sqlite3")

const Types = {
    events: {
        BDS:0,
        Chat:1,
        Server:2,
        Death:3,
        Cmd:4,
        PlayerJoin:5,
        PlayerLeave:6
    },

    blockevents: {
        actiontype: {
            PlaceBlock:0,
            BreakBlock:1
        }
    },
    dimension: {
        OverWorld:0,
        Nether:1,
        TheEnd:2
    }
}

class Logger {
    constructor (dbpath) {
        this.db = new Database(dbpath)
        // WALモードに
        this.db.exec(`PRAGMA journal_mode = WAL;`)
        
        // イベント
        // metadataにはJSON
        // typeの0:BDS、1:Chat、2:Server、3:Death,4:Cmd,5:PlayerJoin,6:PlayerLeave
        this.db.exec(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time INTEGER NOT NULL,
            type INTEGER NOT NULL,
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
        if (typeof player !== "string") throw new Error(`${player} is not string(player)`)
        if (typeof message !== "string") throw new Error(`${message} is not string(message)`)
        if (typeof isdiscord !== "boolean") throw new Error(`${isdiscord} is not string(isdiscord)`)
        const prefix = isdiscord ? "[D]" :""
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.Chat,player,`${prefix}${player}:${message}`,JSON.stringify({isdiscord,player,message}))
    }
    /**
     * @param {string} line 
     */
    BDS(line) {
        if (typeof line !== "string") throw new Error(`${line} is not string(line)`)
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.BDS,null,line,null)
    }
    /**
     * @param {string} data 
     */
    Server(data) {
        if (typeof data !== "string") throw new Error(`${data} is not string(data)`)
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.Server,null,data,null)
    }
    /**
     * @param {string} player 
     * @param {string} reason 
     * @param {{x:number,y:number,z:number}} location 
     * @param {"OverWorld"|"Nether"|"TheEnd"} dimension 
     */
    Death(player,reason,location,dimension) {
        for (const v of Object.entries(location)) {if (typeof v[1] !== "number") throw new Error(`${v[1]} is not number(location:${v[0]})`)}
        if (typeof player !== "string") throw new Error(`${player} is not string(player)`)
        if (typeof reason !== "string") throw new Error(`${reason} is not string(reason)`)
        if(typeof Types.dimension[dimension] !== "number") throw new Error(`[${dimension}] Validation error(dimension)`)
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.Death,player,`${player}(${reason})`,JSON.stringify({player,reason,location,dimension}))
    }
    /**
     * @param {string} data 
     */
    Cmd(data) {
        if (typeof data !== "string") throw new Error(`[${data}] Validation error(data)`) 
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.Cmd,null,data,null)     
    }
    /**
     * @param {string} player 
     */
    PlayerJoin(player) {
        if (typeof player !== "string") throw new Error(`${player} is not string(player)`)
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.PlayerJoin,null,player,null)          
    }
    /**
     * @param {string} player 
     */
    PlayerLeave(player) {
        if (typeof player !== "string") throw new Error(`${player} is not string(player)`)
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.PlayerLeave,null,player,null)  
    }

    // blockevents
    
    /**
     * @param {string} player 
     * @param {string} typeid 
     * @param {"OverWorld"|"Nether"|"TheEnd"} dimension 
     * @param {{x:number,y:number,z:number}} location 
     */
    PlaceBlock(player,typeid,dimension,location) {
        for (const v of Object.entries(location)) {if (typeof v[1] !== "number") throw new Error(`${v[1]} is not number(location:${v[0]})`)}
        if (typeof typeid !== "string") throw new Error(`${typeid} is not string(player)`)
        if(typeof Types.dimension[dimension] !== "number") throw new Error(`[${dimension}] Validation error(dimension)`)
        const prepare = this.db.prepare(`INSERT INTO blockevents (time,actiontype,player,typeid,dimension,x,y,z) VALUES (?,?,?,?,?,?,?,?)`)
        prepare.run(Date.now(),Types.blockevents.actiontype.PlaceBlock,player,typeid,Types.dimension[dimension],location.x,location.y,location.z)  
    }
    /**
     * 
     * @param {string} player 
     * @param {string} typeid 
     * @param {"OverWorld"|"Nether"|"TheEnd"} dimension 
     * @param {{x:number,y:number,z:number}} location 
     */
    BreakBlock(player,typeid,dimension,location) {
        for (const v of Object.entries(location)) {if (typeof v[1] !== "number") throw new Error(`${v[1]} is not number(location:${v[0]})`)}
        if (typeof typeid !== "string") throw new Error(`${typeid} is not string(player)`)
        if(typeof Types.dimension[dimension] !== "number") throw new Error(`[${dimension}] Validation error(dimension)`)
        const prepare = this.db.prepare(`INSERT INTO blockevents (time,actiontype,player,typeid,dimension,x,y,z) VALUES (?,?,?,?,?,?,?,?)`)
        prepare.run(Date.now(),Types.blockevents.actiontype.BreakBlock,player,typeid,Types.dimension[dimension],location.x,location.y,location.z)  
    }
}

module.exports = {Logger,Types}