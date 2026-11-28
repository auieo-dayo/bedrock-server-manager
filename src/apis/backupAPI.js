/**@import JobManager from "../jobManagaer.js" */
/**@import BDSManager from "../BDS.js" */
/**@import PlayerStore from "../playerList.js" */
/**@import BackupManager from "../backup.js" */



class BackupAPI {
    /**
     * 
     * @param {BackupManager} BackupManager 
     * @param {JobManager} JobManager
     * @param {PlayerStore} PlayerStore
     * @param {BDSManager} BDSManager 
     */
    constructor(BackupManager,JobManager,BDSManager,PlayerStore) {
        this.BackupManager = BackupManager
        this.JobManager = JobManager
        this.BDSManager = BDSManager
        this.PlayerStore = PlayerStore
    }

    /**
     * 
     * @param {boolean} fullBackup 
     */
    backup(fullBackup=false) {
        const jobID = this.JobManager.addJob("Backup");
        (async()=> {
            try {
                const list = await this.BackupManager.waitForPreparationsComplete(this.BDSManager)
                this.JobManager.middleJob(jobID,false,"PreparationsComplete")
                await this.BackupManager.backup(list,fullBackup,true,this.PlayerStore,this.BDSManager,reason ? reason : "fromAPI")
                this.JobManager.endJob(jobID,false,{fullBackup,reason:reason?reason:"fromAPI"})
            } catch(e) {
                this.JobManager.endJob(jobID,true,e)
                throw e
            }
        })()
        return {jobID}
    }

    export(target) {
        if (!target) throw new Error("BackupExport API Validation Error");
        const res = this.BackupManager.exportBackup(target)
        return res
    }

    restore(target) {
        if (!target) throw new Error("BackupExport API Validation Error");
        const jobID = this.JobManager.addJob("Restore");
        
        (async()=>{
            try {
                const result = await this.BackupManager.restore(target)
                this.JobManager.endJob(jobID,false,result)
            } catch(e) {
                this.JobManager.endJob(jobID,true,e)
            }
        })()
        return jobID
    }

    async list(isInculudeAllBackups=false) {
        const {data} = await this.BackupManager.getlist("",isInculudeAllBackups);
        return data
    }

}

export default BackupAPI
