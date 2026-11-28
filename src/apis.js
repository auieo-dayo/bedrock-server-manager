import BanAPI from "./apis/banAPI.js"
import BackupAPI from "./apis/backupAPI.js"
import DBAPI from "./apis/dbAPI.js"
import BDSAPI from "./apis/bdsAPI.js"

import { Types as LoggerType } from "./logger.js"
import os from "os"
import { getCpuUsage } from "./cpuusage.js"


/**@import { Logger } from "./logger" */
/**@import PlayerStore from "./playerList.js" */
/**@import JobManager from "./jobManagaer.js" */
/**@import BDSManager from "./BDS.js" */
/**@import BanManager from "./ban.js" */
/**@import BackupManager from "./backup.js" */
/**@import ConfigManager from "./config.js" */
/**@import fetchBDS from "../fetchBDS.js" */


class API {
    /**
     * DBからサーバーログを取得
     * @param {Logger} LogManager 
     * @param {PlayerStore} PlayerStore
     * @param {JobManager} JobManager
     * @param {BDSManager} BDSManager
     * @param {BanManager} BanManager 
     * @param {BackupManager} BackupManager 
     * @param {string} BSMVer 
     * @param {ConfigManager} configManager
     * @param {fetchBDS} fetchBDS 
     * @param {{syncEnv:Function,setModuleConfig:Function,addon_copy:Function}} utils 
     */
    constructor(LogManager,PlayerStore,JobManager,BDSManager,BanManager,BackupManager,BSMVer,configManager,fetchBDS,utils) {
        this.LogManager = LogManager
        this.PlayerStore = PlayerStore
        this.JobManager = JobManager
        this.BDSManager = BDSManager
        this.BSMVer = BSMVer
        this.configManager = configManager
        this.fetchBDS = fetchBDS

        this.ban = new BanAPI(BanManager,this.BDSManager,this.PlayerStore)
        this.backup = new BackupAPI(BackupManager,this.JobManager,this.BDSManager,this.PlayerStore)
        this.db = new DBAPI(this.LogManager)
        this.BDS = new BDSAPI(this.BDSManager,this.configManager,this.JobManager,this.fetchBDS,utils)
    }

    /**
     * 
     * @param {number} __limit 
     */
    getLog(__limit=250) {
        const limit = Number(__limit)
        if (!Number.isSafeInteger(limit) || limit <= -1) throw new Error("getLog API Validation Error");

        // まずタイプ取得
        const logTypes = Object.keys(LoggerType.events)
        // 取得
        const prepare = this.LogManager.db.prepare("SELECT * FROM events ORDER BY time DESC LIMIT ?;")
        const content = prepare.all((limit >= 1) ? limit : 250)
        // 整理
        const organizedContent = content.map((value)=>{
            const metadata = JSON.parse(value.metadata)
            const result = {
                ...value,
                metadata,
                type: logTypes[value.type],
            }

            // タイプごとに調整
            switch (value.type) {
                // チャット
                case LoggerType.events.chat: {
                    result.message = metadata.message
                    result.data = value.message
                    result.isDiscord = metadata.isdiscord
                    break;
                }
                // プレイヤー退室
                case LoggerType.events.PlayerLeave : {
                    result.location = metadata.location
                    result.dimension = metadata.dimension
                    break;
                }
                // 死亡ログ
                case LoggerType.events.death: {
                    result.player = value.player
                    result.reason = metadata.reason
                    result.location = metadata.location
                    result.location = metadata.location
                    result.dimension = metadata.dimension
                }
            }

            return result
        })

        return organizedContent
    }
    
    getOnlineList() {
        /**@type {name:string,xuid:number,joined:number} */
        const onlinePlayers = this.PlayerStore.getAll()
        return onlinePlayers
    }

    /**@param {string} playername  */
    async getPlayerInfo(playername) {
        const jobID = this.JobManager.addJob("GetPlayerInfo")
        const json = JSON.stringify({"type":"getplayerinfo",playername,jobID}).replaceAll("\"","'").replaceAll("\\","\\\\'")
        
        this.BDSManager.sendCommand(`send "${json}"`,true)

        /**@type {{type:string,playername:string,iserr:boolean,data:{dimension:string,location:{x:number,y:number,z:number},hp:{now:number,max:number},gamemode:string,mainhand:string},jobID:string}} */
        const result = await new Promise((resolve,reject)=>{
            const id = setTimeout(()=>{
                reject(new Error("Get PlayerInfo Timeout."))
            },1000*15)
            const onEndJob = (jobid,__isfailed,result)=>{
                if (jobID !== jobid) return;
                clearTimeout(id)
                resolve(result);
            }
            this.JobManager.once("endJob",onEndJob)
        })

        return result
    }

    /**@param {string} playername  */
    getLastLogoutInfo(playername) {
        if (!playername) throw new Error("LastLogoutInfo API Validation Error");
        const res = this.LogManager.db.prepare(`SELECT * FROM events WHERE type = ${LoggerType.events.PlayerLeave} AND player = ? ORDER BY time DESC LIMIT 1`).get(playername)
        
        if (res) {
            const metadata = JSON.parse(res.metadata)
            const location = {x:Number(metadata.location.x).toFixed(0),y:Number(metadata.location.y).toFixed(0),z:Number(metadata.location.z).toFixed(0)}
            return {success:true,playername,logoutTime:res.time,location,dimension:metadata.dimension}
        } else {
            return {success:false,playername}
        }
    }

    /**
     * 
     * @param {string} playername 
     * @param {number} __limit 
     */
    getPlayerDeathInfo(playername,__limit=10) {
        const limit = Number(__limit)
        if (!playername || !Number.isSafeInteger(limit) || limit <= -1) throw new Error("PlayerDeathInfo API Validation Error");
        // time,type,player,message,metadata
        /**@type {{time:number,type:number,player:string,message:string,metadata:string}[]} */
        const res = this.LogManager.db.prepare(`SELECT * FROM events WHERE type = ${LoggerType.events.death} AND player = ? ORDER BY time DESC LIMIT ?`).all(playername,limit)
        const organizedContent = res.map((value)=>{
            /**@type {{reason:string,dimension:string,location:{x:number,y:number,z:number}}}*/
            const metadata = JSON.parse(value.metadata)

            return {...value,metadata}
        })
        return organizedContent
    }

    /**
     * 
     * @param {{block:string[]|undefined,actionType:number[]|undefined,period:{from:number,to:number}|undefined}} filter 
     * @param {number} __limit
     */
    getBlockEventLog(filter={},__limit=150) {
        const limit = Number(__limit)
        if (!Number.isSafeInteger(limit) || limit <= -1) throw new Error("BlockEvent API Validation Error");


        const conditions = []
        const params = []


        // ブロックフィルター
        filter.block?.forEach((value,i,arr)=>{
            // 最初かつ2種以上あるなら
            if (i === 0 && arr.length >= 2) {
                conditions.push(`(typeid = ? OR`)
            }
            // 最初でも最後でもないかつ2種以上あるなら
            else if (i !== 0 && arr.length-1 !== i && arr.length >= 2) {
                conditions.push("typeid = ? OR")
            }
            // 最後かつ2種以上あるなら
            else if (arr.length-1 === i && arr.length >= 2) {
                conditions.push("typeid = ? )")
            }
            // それ以外なら
            else {
                conditions.push("typeid = ?")
            }
            params.push(value)
        })

        // イベントの種類
        filter.actionType?.forEach((value,i,arr)=>{
            // とりま値の範囲チェック
            if (!Object.values(LoggerType.blockevents.actiontype).includes(value)) {
                throw new Error("BlockEvent API Validation Error")
            }
            // 最初かつブロックフィルターがあるなら
            if (i === 0 && ((filter.block?.length) >= 1)) {
                conditions.push(`AND`)
            }

            // 最初かつ2種以上あるなら
            if (i === 0 && arr.length >=2) {
                conditions.push(`(actiontype = ?`)
            }
            // 最初でも最後でもないかつ2種以上あるなら
            else if (i !== 0 && arr.length-1 !== i && arr.length >= 2) {
                conditions.push("OR actiontype = ?")
            }
            // 最後かつ2種以上あるなら
            else if (arr.length-1 === i && arr.length >= 2) {
                conditions.push("OR actiontype = ? )")
            }
            params.push(value)
        })

        if (typeof filter.period?.from === "number" && typeof filter.period?.to === "number") {
            // 範囲チェック        
            if ((filter.period.from - filter.period.to) > 0) {
                throw new Error("BlockEvent API Validation Error")
            }
            
            // イベントの種類のフィルターがあるなら
            if ((filter.actionType?.length) >= 1) {
                conditions.push(`AND`)
            }

            conditions.push("(time >= ? AND time <= ?)")
            params.push(filter.period.from,filter.period.to)
        }

        const SQL = `SELECT * FROM blockevents ${conditions.length !== 0?"WHERE ":""}${conditions.join(" ")} ORDER BY time DESC LIMIT ?`
        params.push(limit)

        /**@type {{time:number,actionType:number,player:string,typeid:string,dimension:string,x:number,y:number,z:number}[]|undefined[]} */
        const result = this.LogManager.db.prepare(SQL).all(...params)
        return result
    }

    async getInfo() {
        const cpu = (await getCpuUsage(100)).toFixed(0)
        const memFree = os.freemem()/1073741824
        const memTotal = os.totalmem()/1073741824
        const memPer = (100-((memFree / memTotal) * 100)).toFixed(0)
        const cpumodel = os.cpus()[0].model
        // これ秒数
        const uptime = process.uptime()

        return {
            BDSManagerver:this.BDSManager.BDSManagerver,
            BSMVer:this.BSMVer,
            cpu: {percent:cpu,cpumodel},
            memory: {free:memFree,total:memTotal,percent:memPer},
            uptime
        }
    }

}

export default API