import { EmbedBuilder } from "discord.js"


async function pl(onlinePlayer,message) {
    let list = "player...\n\n"
    onlinePlayer.getAll().forEach((value)=>{
        list+=`- <${value.name}>\n`
    });
    const embed = new EmbedBuilder()
    .setTitle("プレイヤー一覧")
    .setDescription(`${list}`)
    .setColor(0xff4778)
    .setTimestamp(new Date())
    await message.reply({ embeds: [embed] });
}

export default pl