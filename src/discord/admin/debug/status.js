const { EmbedBuilder } = require("discord.js");
/**
 * 
 * @param {boolean} process_alive 
 * @param {string} BSMVer 
 * @param {string | null} BDSver 
 * @param {number | null} latestBackup 
 * @param {boolean | null} isLatestBackupFull
 */
async function status(message,process_alive,BSMVer,BDSver,latestBackup,isLatestBackupFull) {
    const embed = new EmbedBuilder()
    embed.setTitle("Status")
    embed.setTimestamp(new Date())
    const backupD = latestBackup ? `<t:${Math.floor(latestBackup/1000)}:R>` : "Null"
    embed.addFields(
        {name:"BDS-Alive",value:process_alive ? "🟢" : "🔴"},
        {name:"BDS-ver",value:BDSver || "Offline",inline:true},
        {name:"BSM-ver",value:BSMVer,inline:true},
        {name:"LatestBackup",value:`${backupD} | ${isLatestBackupFull ? "FULL" : "Diff"}`},
    )
    await message.reply({embeds:[embed]})
}

module.exports = status