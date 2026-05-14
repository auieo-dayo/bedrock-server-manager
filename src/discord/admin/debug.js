const { EmbedBuilder } = require("discord.js");
const os = require("os");
const { getCpuUsage } = require("../../cpuusage");

async function debug(message,logm) {
    const cpu = (await getCpuUsage(100)).toFixed(0)
    const memFree = os.freemem()/1073741824
    const memTotal = os.totalmem()/1073741824
    const memPer = (100-((memFree / memTotal) * 100)).toFixed(0)
    const cpumodel = os.cpus()[0].model
    const sec = Date.now()/1000
    const systemUptime = (sec - os.uptime()).toFixed(0)
    const processUptime = (sec - process.uptime()).toFixed(0)
    
    const counts = logm.db.prepare(`SELECT * FROM sqlite_sequence;`).all()

    const embed = new EmbedBuilder()
    embed.setTitle("デバック情報")
    embed.addFields(
        {name:"models",value:`CPU:${cpu}%(${cpumodel})\nメモリ:${memPer}%(${memFree.toFixed(0)}GB/${memTotal.toFixed(0)}GB)`},
        {name:"System-Uptime",value:`<t:${systemUptime}:S>`,inline:true},
        {name:"BSW-Uptime",value:`<t:${processUptime}:S>`,inline:true},
        {name:"DB-events",value:`${counts.find(v=>v.name === "events").seq}件`},
        {name:"DB-blockEvents",value:`${counts.find(v=>v.name === "blockevents").seq}件`}
    )
    embed.setTimestamp(new Date())
    await message.reply({embeds:[embed]})
}

module.exports = debug