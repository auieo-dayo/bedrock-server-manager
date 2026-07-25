import { EmbedBuilder } from "discord.js";
import { formatDate } from "../../../formatDate.js"

// content[1]
async function isbanned(bm,playername,message) {
    if (!playername) {
        return await message.reply("プレイヤー名がありません")
    }
    const info = bm.getinfo(playername)
    if (!info) {
        return await message.reply(`${playername}はBANされていません`)
    }
    let expiredtimetext = ``
    if (!info.expiredtime) expiredtimetext = "**無期限**"; else {
        expiredtimetext = `<t:${Math.floor(info.expiredtime / 1000)}:R>`
    }

    const embed = new EmbedBuilder()
    .setTitle(`[${playername}]のBAN情報`)
    .setTimestamp(new Date())
    .setColor(0xeb7734)
    .setTimestamp(new Date())
    if (!info) embed.setDescription("BANされていません");else embed.setDescription(`BANされています。\n理由:${info.reason}\n解除まで:${expiredtimetext}\n-# BANした人:${info.author.author}(${info.author.isdiscord ? "Discord" : "Minecraft"})\n-# BAN時刻:${formatDate(new Date(info.time))}`)
    await message.reply({embeds:[embed]})
}
export default isbanned

