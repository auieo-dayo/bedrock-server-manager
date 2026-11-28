/**@import BanManager from "../ban.js" */
/**@import BDS from "../BDS.js" */
/**@import PlayerStore from "../playerList.js" */


class BanAPI {
    /**
     * @param {BanManager} BanManager  
     * @param {BDS} BDS 
     * @param {PlayerStore} PlayerStore 
     */
    constructor(BanManager,BDS,PlayerStore) {
        this.BanManager = BanManager
        this.BDS = BDS
        this.PlayerStore = PlayerStore
    }
    
    /**
     * 
     * @param {string} playername 
     * @param {string|undefined} reason 
     * @param {{isdisocrd:boolean,author:string}} author 
     * @param {number|undefined} expiredtime 解除までの時間(ms) 
     */
    ban(playername,reason,author,__expiredtime) {
        if (!playername || !author) throw new Error("BAN API Validation Error");
        const expiredtime = Date.now()+expired*60*60*1000
        this.BanManager.ban(playername,reason,author,expiredtime)

        if (this.PlayerStore.players.has(playername)) {
            const BanStart = new Date()
            const BanStartText = formatDate(BanStart)
            const BanEnd = expiredtime ? new Date(expiredtime) : null
            const BanEndText = BanEnd ? msToYMDHMS(BanStart,BanEnd) : "無期限"
            const NowtoBanEndText = BanEnd ? msToYMDHMS(new Date(),BanEnd) : "無期限" 

            const message = `あなたは「§l${reason}§r」により§l${BanStartText}§rから§l${BanEndText}§rの間BANされています。解除まで:§l${NowtoBanEndText}§r`
            
            const json = JSON.stringify({"type":"kick",playername,"message":`${Buffer.from(message).toString("base64")}`}).replaceAll("\"","'").replaceAll("\\","\\\\'")
            this.BDS.sendCommand(`send "${json}"`)
        }
    }
    /**@param {string} playername  */
    isBanned(playername) {
        if (!playername) throw new Error("ISBANNED API Validation Error");
        /**@type {{gamertag:string,reason:string,author:{isdisocrd:boolean,author:string},time:number,expiredtime:number} | undefined} */
        const banInfo = this.BanManager.getinfo(playername)
        const result = {...banInfo,banned:false,playername}
        if (!banInfo) return result;
        result.banned = true
        return result
    }

    list() {
        /**@type {{gamertag:string,reason:string,author:{isdisocrd:boolean,author:string},time:number,expiredtime:number}[]} */
        const banList = this.BanManager.allbanlist()
        return banList 
    }

    /**@param {string} playername  */
    pardon(playername) {
        if (!playername) throw new Error("PARDON API Validation Error");

        const result = this.BanManager.pardon(playername)
        result.success = result.delete
        return result
    }
}


export default BanAPI