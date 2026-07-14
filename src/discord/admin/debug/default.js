const { EmbedBuilder } = require("discord.js");
const os = require("os");
const { getCpuUsage } = require("../../../cpuusage");


async function d(message,logm) {
    await message.deferReply({content:"取得中です..."})

    const cpu = (await getCpuUsage(100)).toFixed(0)
    const memFree = os.freemem()/1073741824
    const memTotal = os.totalmem()/1073741824
    const memPer = (100-((memFree / memTotal) * 100)).toFixed(0)
    const cpumodel = os.cpus()[0].model
    const sec = Date.now()/1000
    const systemUptime = (sec - os.uptime()).toFixed(0)
    const processUptime = (sec - process.uptime()).toFixed(0)
    
    const events_count = logm.db.prepare(`SELECT COUNT(*) AS count FROM events`).get()
    const blockEvents_count = logm.db.prepare(`SELECT COUNT(*) AS count FROM blockevents`).get()

    const embed = new EmbedBuilder()
    embed.setTitle("デバック情報")
    embed.addFields(
        {name:"models",value:`CPU:${cpu}%(${cpumodel})\nメモリ:${memPer}%(${memFree.toFixed(0)}GB/${memTotal.toFixed(0)}GB)`},
        {name:"System-Uptime",value:`<t:${systemUptime}:S>`,inline:true},
        {name:"BSW-Uptime",value:`<t:${processUptime}:S>`,inline:true},
        {name:"DB-events",value:`${events_count?.count || 0}件`},
        {name:"DB-blockEvents",value:`${blockEvents_count?.count || 0}件`}
    )
    embed.setTimestamp(new Date())
    await message.editReply({embeds:[embed]})
}

module.exports = d