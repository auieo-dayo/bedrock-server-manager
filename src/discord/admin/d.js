const { EmbedBuilder } = require("discord.js");
const config = require("../../../config/config.js");
const { Types } = require("../../logger.js");

async function d(playername,message,channel,logger) {
  if (!channel) return
  if (!config.Discord.notifications.toAdmin.deathInfo.enabled) return
  if (!message) return

  const embed = new EmbedBuilder()
  embed.setTimestamp(new Date())

  embed.setTitle(`[${playername}]の死亡情報`)
    const res = logger.db.prepare(`SELECT * FROM events WHERE type = ${Types.events.death} AND player = ? ORDER BY time DESC LIMIT 10`).all(playername)
    if (!res[0]) {
      embed.setDescription(`[${playername}]の死亡情報が見つかりませんでした。`)
      embed.setColor(0xed0000)
    } else {
      let text = ""
      res.forEach((v)=>{
        const date = new Date(v.time)
        const metadata = JSON.parse(v.metadata)
        const dateja = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}時${String(date.getMinutes()).padStart(2, "0")}分${String(date.getSeconds()).padStart(2, "0")}秒`
        text+=`- ${dateja}\n\`(${metadata.location.x.toFixed(0)} ${metadata.location.y.toFixed(0)} ${metadata.location.z.toFixed(0)},${metadata.reason})\`\n\n`
      })
      embed.setDescription(text)
      embed.setColor(0x1fd15e)
  }
  
  
  await message.reply({ embeds: [embed] });
}
module.exports = d