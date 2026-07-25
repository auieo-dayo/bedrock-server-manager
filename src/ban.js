import fs from "fs-extra"
import path from "path"

class BanManager {
    constructor(root) {
        try {
            this.cache = new Map()

            const folder = path.join(root, "datas")
            const filename = "bans.json"
            const fullpath = path.join(folder, filename)
            this.path = { folder, filename, fullpath }

            fs.ensureDirSync(this.path.folder)
            if (!fs.existsSync(this.path.fullpath)) fs.writeFileSync(this.path.fullpath,`[]`);
            this.unban = this.pardon
            this.load()
        } catch(e) {
            console.log(`[BanManager]Initialization - ${e}`)
        }
    }
    load() {
        const json = JSON.parse(fs.readFileSync(this.path.fullpath))
        Object.entries(json).forEach(([gamertag, data]) => {
            this.cache.set(gamertag, data);
        });
    }
    save() {
        fs.writeFileSync(this.path.fullpath,JSON.stringify(Object.fromEntries(this.cache),null,2))
    }
    ban(gamertag,reason="",author,expiredtime) {
        if (!gamertag) return
        this.cache.set(gamertag,{gamertag,reason,author,time:Date.now(),expiredtime: expiredtime || null})
        this.save()
        return {gamertag,reason}
    }
    pardon(gamertag) {
        const data = this.cache.get(gamertag)
        if (!data) return {delete:false}
        const del = this.cache.delete(gamertag)
        this.save()
        return {delete:del,gamertag:data.gamertag,reason:data.reason,time:data.time,author:data.author}
    }
    isbanned(gamertag,deleteIfExpired=false) {
        const has = this.cache.has(gamertag)
        // BANされていない場合
        if (!has) return false
        const active = this.isActive(gamertag)
        // 有効期限を確認
        if (!active) {
            // 有効期限切れかつフラグがtrueならBAN解除
            if(deleteIfExpired) this.pardon(gamertag);
        
            return false
        }

        // 無期限BAN or 期限が切れていない場合
        return true
    }
    getinfo(gamertag,chkAndDeleteIfExpired=false) {
        const info = this.cache.get(gamertag)
        if (!info) return null
        // 有効期限切れかつフラグがtrueならBAN解除
        if (chkAndDeleteIfExpired && !this.isActive(gamertag)) {
            this.pardon(gamertag);
            return null
        }
        return info
    
    }
    allbanlist() {
        const now = Date.now();
        const list = [];

        this.cache.forEach((info) => {
            if (!info.expiredtime || info.expiredtime >= now) {
                list.push(info);
            }
        });

        return list;
    }
    isActive(gamertag) {
        const info = this.cache.get(gamertag)
        const {expiredtime} = info
        if (!expiredtime) return true
        if (expiredtime <= Date.now()) return false
        return true
    }

}
export default BanManager