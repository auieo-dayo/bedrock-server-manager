import { v7 } from "uuid"

/**@typedef {"endJob"|"middleJob"} Event */

class jobManager {
    constructor() {
        this.jobs = new Map()
        this._events = {
            endJob: []
        }
    }
    
    /**
     * @param {"ExportBackup"|"GetPlayerInfo"|"Backup"|"Restore"|"Update"} jobType 
     */
    addJob(jobType) {
        const jobid = v7()
        let result = {}
        switch(jobType) {
            case "ExportBackup": {
                result = {path:""}
                break;
            }
        }
        this.jobs.set(jobid,{jobType,id:jobid,ended:false,isfailed:false,result,updateAt:Date.now()})
        return jobid
    }

    /**
     * @param {string} jobid
     * @param {boolean} isfailed
     * @param {object} result   
     */
    middleJob(jobid,isfailed,message) {
        /**
         * @type {{jobType:string,id:string,ended:boolean,isfailed:boolean,result:object}|undefined}
         */
        const job = this.jobs.get(jobid)
        if (!job) return undefined;
        this.jobs.set(jobid,{...job,ended:false,isfailed,message,updateAt:Date.now()})
        this.emit("middleJob",jobid,isfailed,result)
        return job
    }
    /**
     * @param {string} jobid
     * @param {boolean} isfailed
     * @param {object} result   
     * @param {string} message 
     */
    endJob(jobid,isfailed,result,message) {
        /**
         * @type {{jobType:string,id:string,ended:boolean,isfailed:boolean,result:object}|undefined}
         */
        const job = this.jobs.get(jobid)
        if (!job) return undefined;
        this.jobs.set(jobid,{...job,ended:true,isfailed,result,updateAt:Date.now(),message})
        this.emit("endJob",jobid,isfailed,result,message)
        return job
    }
    /**
     * @param {string} jobid 
     */
    deleteJob(jobid) {
        /**
         * @type {{jobType:string,id:string,ended:boolean,result:object}|undefined}
         */
        const job = this.jobs.get(jobid)
        if (!job) return undefined;
        this.jobs.delete(jobid)
        return job
    }
    /**
     * @param {string} jobid 
     */
    getJob(jobid) {
        /**
         * @type {{jobType:string,id:string,ended:boolean,isfailed:boolean,result:object}|undefined}
         */
        const job = this.jobs.get(jobid)
        return job
    }
    /**
     * 
     * @param {Event} event 
     * @param {(jobid:string,isfailed:boolean,result:any)=>void} callback 
     */
    on(event, callback) {
        if (!this._events[event]) {
            this._events[event] = []
        }
        this._events[event].push(callback)
    }
    /**
     * 
     * @param {Event} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!this._events[event]) return
        this._events[event] = this._events[event].filter(fn => fn !== callback)
    }
    /**
     * 
     * @param {Event} event
     * @param {string} jobid 
     * @param {boolean} isfailed
     * @param {any} result  
     */
    emit(event,jobid,isfailed,result) {
        if (!this._events[event]) return
        for (const fn of this._events[event]) {
            fn(jobid,isfailed,result)
        }
    }
}

export default jobManager