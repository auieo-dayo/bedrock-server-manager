const { v4: uuidv4 } = require('uuid');


class jobManager {
    constructor() {
        this.jobs = new Map()
        this._events = {
            endJob: []
        }
    }
    
    /**
     * @param {"ExportBackup"} jobType 
     */
    addJob(jobType) {
        const jobid = uuidv4()
        let result = {}
        switch(jobType) {
            case "ExportBackup": {
                result = {path:""}
                break;
            }
        }
        this.jobs.set(jobid,{jobType,id:jobid,ended:false,isfailed:false,result})
        return jobid
    }
    /**
     * @param {string} jobid
     * @param {boolean} isfailed
     * @param {object} result   
     */
    endJob(jobid,isfailed,result) {
        /**
         * @type {{jobType:string,id:string,ended:boolean,isfailed:boolean,result:object}|undefined}
         */
        const job = this.jobs.get(jobid)
        if (!job) return undefined;
        this.jobs.set(jobid,{...job,ended:true,isfailed,result})
        this.emit("endJob",jobid,isfailed,result)
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
     * @param {"endJob"} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (!this._events[event]) {
            this._events[event] = []
        }
        this._events[event].push(callback)
    }
    /**
     * 
     * @param {"endJob"} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!this._events[event]) return
        this._events[event] = this._events[event].filter(fn => fn !== callback)
    }
    /**
     * 
     * @param {"endJob"} event 
     * @param {...any} args 
     */
    emit(event, ...args) {
        if (!this._events[event]) return
        for (const fn of this._events[event]) {
            fn(...args)
        }
    }
}

module.exports = jobManager