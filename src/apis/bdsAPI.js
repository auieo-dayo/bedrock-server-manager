/**@import BDSManager from "../BDS.js" */
/**@import ConfigManager from "../config.js" */
/**@import JobManager from "../jobManagaer.js" */
/**@import fetchBDS from "../fetchBDS.js" */


class bdsAPI {
    /**
     * 
     * @param {BDSManager} BDSManager 
     * @param {ConfigManager} configManager 
     * @param {JobManager} JobManager 
     * @param {fetchBDS} fetchBDS
     * @param {{syncEnv:Function,setModuleConfig:Function,addon_copy:Function}} utils   
     */
    constructor(BDSManager,configManager,JobManager,fetchBDS,utils) {
        this.BDSManager = BDSManager
        this.configManager = configManager
        this.JobManager = JobManager
        this.fetchBDS = fetchBDS
        this.utils = utils
    }

    forceRestart() {
      this.BDSManager.bds.once("close",()=>{
        bds.restart()
      })
      this.BDSManager.forceExit("SIGKILL")
    }

    async CheckUpdate() {
        const result = {updatable:false,version:this.BDSManager.BDSver,latestVersion:null}
        const latestVersionList = await this.fetchBDS.getLatestVersion()
        const latestVersion = latestVersionList[this.fetchBDS.getRunningOS()][`${this.configManager.update.Minecraft.isPreview?"Preview":"Release"}`].version
        result.latestVersion = latestVersion
        if (this.BDSManager.BDSver !== latestVersion) {
            result.updatable = true
        }
        return result
    }

    async update() {
        const jobID = this.JobManager.addJob("Update");

        (async()=>{
            try {
                if (this.fetchBDS.updating) {
                    this.JobManager.endJob(jobID,false,{version:this.BDSManager.BDSver},"update is already in progress.")
                    return
                }
                const latestVersionList = await this.fetchBDS.getLatestVersion()
                const latestVersion = latestVersionList[this.fetchBDS.getRunningOS()][`${this.configManager.update.Minecraft.isPreview?"Preview":"Release"}`].version;
                this.JobManager.middleJob(jobID,false,"FetchedVersionList")
                
                if (latestVersion === this.BDSManager.BDSver) {
                    this.JobManager.endJob(jobID,false,{version:latestVersion},"Not Updatable")
                    return
                }
                
                this.JobManager.middleJob(jobID,false,"ExitingBDS")

                const onClose = async() =>{
                    this.JobManager.middleJob(jobID,false,"Fetch and Extracting BDS")
                    
                    this.BDSManager.off("close",onClose)
                    await this.fetchBDS(this.configManager.update.Minecraft.isPreview,this.fetchBDS.getRunningOS(),await this.fetchBDS.getLatestVersion())
                    
                    this.JobManager.middleJob(jobID,false,"Init BDS")
                    await this.utils.syncEnv()
                    await this.utils.setModuleConfig()
                    await this.utils.addon_copy()


                    this.BDSManager.restart()
                    this.JobManager.endJob(jobID,false,{version:latestVersion},"Restarting BDS")
                }
                this.BDSManager.on("close",onClose)
                this.BDSManager.exit()
            } catch(e) {
                this.JobManager.endJob(jobID,true,e)
            }
        })()
        return jobID
    }
    
}

export default bdsAPI