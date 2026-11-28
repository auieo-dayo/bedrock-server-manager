import fs from "fs-extra"
import path from "path"


/**@import { Logger } from "../logger" */

class dbAPI {
    /**
     * 
     * @param {Logger} LogManager 
     */
    constructor(LogManager) {
        this.LogManager = LogManager
    }

    async getSize() {
        const folder = path.dirname(this.LogManager.dbpath)
        const DB = await fs.stat(path.join(folder,"app.db"))
        const Wal = await fs.stat(path.join(folder,"app.db-wal"))
        return {db:DB.size,wal:Wal.size}
    }

    getRecordCount() {
        const result = {}
        const tables = this.LogManager.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all()
        for (const table of tables) {
            const count = this.LogManager.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()
            result[table] = count.count
        }
        return result
    }

    getLastUpdate() {
        return this.LogManager.lastUpdate
    }

    /**
     * 
     * @param {"PASSIVE"|"RESTART"|"TRUNCATE"|undefined} mode 
     */
    WALCheckPoint(mode="PASSIVE") {
        if (!["PASSIVE","RESTART","TRUNCATE"].includes(mode)) throw new Error("DB WALCheckPoint API Validation Error")
        const res = this.LogManager.db.pragma(`PRAGMA wal_checkpoint(${mode})`)
        const result = {
            busy: res[0].busy === 1 ? true : false,
            log: res[0].log,
            checkpointed: res[0].checkpointed
        }
        return result
    }

}

export default dbAPI
