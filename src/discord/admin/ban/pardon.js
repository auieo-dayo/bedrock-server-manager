import {formatDate} from "../../../formatDate"

// content[1]
async function pardon(playername,bm,message) {
    if (!playername) return await message.reply("プレイヤー名がありません");
    const res = bm.pardon(playername)
    if (!res.delete) return await message.reply({content:"BAN解除に失敗しました"});
    await message.reply(`${res.gamertag}のBAN解除に成功しました。(${res.reason})\n-# BAN時刻:${formatDate(new Date(res.time))}`)
}
export default pardon