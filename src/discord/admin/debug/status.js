const { EmbedBuilder } = require("discord.js");
/**
 * 
 * @param {boolean} process_alive 
 * @param {string} BSWver 
 * @param {string | null} BDSver 
 * @param {number | null} latestBackup 
 * @param {boolean | null} isLatestBackupFull
 */
async function status(message,process_alive,BSWver,BDSver,latestBackup,isLatestBackupFull) {
    const embed = new EmbedBuilder()
    embed.setTitle("Status")
    embed.setTimestamp(new Date())
    const backupD = latestBackup ? `<t:${Math.floor(latestBackup/1000)}:R>` : "Null"
    embed.addFields(
        {name:"BDS-Alive",value:process_alive ? "🟢" : "🔴"},
        {name:"BDS-ver",value:BDSver || "Offline",inline:true},
        {name:"BSW-ver",value:BSWver,inline:true},
        {name:"LatestBackup",value:`${backupD} | ${isLatestBackupFull ? "FULL" : "Diff"}`},
    )
    await message.reply({embeds:[embed]})
}

module.exports = status