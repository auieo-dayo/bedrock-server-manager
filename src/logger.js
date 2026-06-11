const Database = require("better-sqlite3")

const Types = {
    events: {
        BDS:0,
        chat:1,
        server:2,
        death:3,
        cmd:4,
        PlayerJoin:5,
        PlayerLeave:6
    },

    blockevents: {
        actiontype: {
            PlaceBlock:0,
            BreakBlock:1,
            ExplodeBlock:2
        }
    }
}

class Logger {
    constructor (dbpath) {
        this.dbpath = dbpath
        this.db = new Database(this.dbpath)
        // WALモードに
        this.db.exec(`PRAGMA journal_mode = WAL;`)
        
        // イベント
        // metadataにはJSON
        // typeの0:BDS、1:chat、2:server、3:death,4:cmd,5:PlayerJoin,6:PlayerLeave
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
        // actiontypeが0はplace、1はbleak、2はTNTによる破壊
        // dimensionはID
        this.db.exec(`CREATE TABLE IF NOT EXISTS blockevents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actiontype INTEGER NOT NULL,
            player TEXT NOT NULL,
            time INTEGER NOT NULL,
            typeid TEXT NOT NULL,
            dimension TEXT NOT NULL,
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
        prepare.run(Date.now(),Types.events.chat,player,`${prefix}${player}:${message}`,JSON.stringify({isdiscord,message}))
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
     * @param {boolean | undefined} isstartuptext
     */
    Server(data,isstartuptext) {
        if (typeof data !== "string") throw new Error(`${data} is not string(data)`)
        let metadata = null
        if (isstartuptext) metadata = {isStartUp:true}
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.server,null,data,JSON.stringify(metadata))
        
    }
    /**
     * @param {string} player 
     * @param {string} reason 
     * @param {{x:number,y:number,z:number}} location 
     * @param {string} dimension 
     */
    Death(player,reason,location,dimension) {
        for (const v of Object.entries(location)) {if (typeof v[1] !== "number") throw new Error(`${v[1]} is not number(location:${v[0]})`)}
        if (typeof player !== "string") throw new Error(`${player} is not string(player)`)
        if (typeof reason !== "string") throw new Error(`${reason} is not string(reason)`)
        if(typeof dimension != "string") throw new Error(`[${dimension}] is not string(dimension)`)
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.death,player,`${player}(${reason})`,JSON.stringify({reason,location,dimension}))
    }
    /**
     * @param {string} data 
     */
    Cmd(data) {
        if (typeof data !== "string") throw new Error(`[${data}] Validation error(data)`) 
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.cmd,null,data,null)     
    }
    /**
     * @param {string} player 
     */
    PlayerJoin(player) {
        if (typeof player !== "string") throw new Error(`${player} is not string(player)`)
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.PlayerJoin,player,null,null)          
    }
    /**
     * @param {string} player 
     * @param {string} dimension 
     * @param {{x:number,y:number,z:number}} location  
    */
    PlayerLeave(player,location,dimension) {
        if (typeof player !== "string") throw new Error(`${player} is not string(player)`)
        if(typeof dimension != "string") throw new Error(`[${dimension}] is not string(dimension)`)
        const prepare = this.db.prepare(`INSERT INTO events (time,type,player,message,metadata) VALUES (?,?,?,?,?)`)
        prepare.run(Date.now(),Types.events.PlayerLeave,player,null,JSON.stringify({location,dimension}))  
    }

    // blockevents
    
    /**
     * @param {string} player 
     * @param {string} typeid 
     * @param {string} dimension 
     * @param {{x:number,y:number,z:number}} location 
     */
    PlaceBlock(player,typeid,dimension,location) {
        for (const v of Object.entries(location)) {if (typeof v[1] !== "number") throw new Error(`${v[1]} is not number(location:${v[0]})`)}
        if (typeof typeid !== "string") throw new Error(`${typeid} is not string(typeid)`)
        if(typeof dimension != "string") throw new Error(`[${dimension}] is not string(dimension)`)
        const prepare = this.db.prepare(`INSERT INTO blockevents (time,actiontype,player,typeid,dimension,x,y,z) VALUES (?,?,?,?,?,?,?,?)`)
        prepare.run(Date.now(),Types.blockevents.actiontype.PlaceBlock,player,typeid,dimension,location.x,location.y,location.z)  
    }
    /**
     * 
     * @param {string} player 
     * @param {string} typeid 
     * @param {string} dimension 
     * @param {{x:number,y:number,z:number}} location 
     */
    BreakBlock(player,typeid,dimension,location) {
        for (const v of Object.entries(location)) {if (typeof v[1] !== "number") throw new Error(`${v[1]} is not number(location:${v[0]})`)}
        if (typeof typeid !== "string") throw new Error(`${typeid} is not string(typeid)`)
        if(typeof dimension != "string") throw new Error(`[${dimension}] is not string(dimension)`)
        const prepare = this.db.prepare(`INSERT INTO blockevents (time,actiontype,player,typeid,dimension,x,y,z) VALUES (?,?,?,?,?,?,?,?)`)
        prepare.run(Date.now(),Types.blockevents.actiontype.BreakBlock,player,typeid,dimension,location.x,location.y,location.z)  
    }

    /**
     * @param {string} source 
     * @param {string} dimension 
     * @param {{x:number,y:number,z:number}} location
     * @param {{typeid:string,location:{x:number,y:number,z:number}}[]} blocks 
     */
    ExplodeBlock(source,dimension,location,blocks) {
        if (!Array.isArray(blocks)) throw new Error(`${blocks} is not array(Blocks)`)
        // if (typeof typeid !== "string") throw new Error(`${typeid} is not string(player)`)
        if(typeof dimension != "string") throw new Error(`[${dimension}] is not string(dimension)`)
        
        // 追加してく
        const date = Date.now()
        const insert = this.db.transaction((blocks) => {
            const prepare = this.db.prepare(`INSERT INTO blockevents (time,actiontype,player,typeid,dimension,x,y,z) VALUES (?,?,?,?,?,?,?,?)`);
            for (const block of blocks) {
                if (typeof block.location.x !== "number") throw new Error(`${block.location.x} is not number(blocks[].location:x)`);
                if (typeof block.location.y !== "number") throw new Error(`${block.location.y} is not number(blocks[].location:y)`);
                if (typeof block.location.z !== "number") throw new Error(`${block.location.z} is not number(blocks[].location:z)`);
                if (typeof block.typeid !== "string") throw new Error(`${block.typeid} is not string(blocks[].typeid)`)

                prepare.run(date,Types.blockevents.actiontype.ExplodeBlock,source,block.typeid,dimension,block.location.x,block.location.y,block.location.z)  
            }
        })
        insert(blocks)
    }
}

module.exports = {Logger,Types}