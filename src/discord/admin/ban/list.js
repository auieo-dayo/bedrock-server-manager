import { EmbedBuilder } from "discord.js"; 

async function list(bm,message) {
    let md = ""
    for (const p of bm.allbanlist()) {
    let expiredtimetext = ``
    if (!p.expiredtime) expiredtimetext = "**無期限**"; else {
        expiredtimetext = `<t:${Math.floor(p.expiredtime / 1000)}:R>`
    }
    md+=`- ${p.gamertag}(${p.reason})(解除まで: ${expiredtimetext})\n`
    }
    const embed = new EmbedBuilder()
        .setTitle("BAN List")
        .setTimestamp(new Date())
        .setDescription(md || "Error")
        .setColor(0xebba34)
        .setTimestamp(new Date())
    await message.reply({embeds:[embed]})
}
export default list