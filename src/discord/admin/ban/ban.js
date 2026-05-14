const { msToYMDHMS, formatDate } = require("../../../formatDate");

// content[1],content[2]

async function ban(playername,reason,bm,onlinePlayer,bds,message,author,expiredtime) {
    
    if (!playername) return await message.reply("プレイヤー名がありません");
    if (!reason) return await message.reply("理由がありません");
    
    bm.ban(playername,reason,author,expiredtime)
    if (onlinePlayer.players.has(playername)) {
        const BanStart = new Date()
        const BanStartText = formatDate(BanStart)
        const BanEnd = expiredtime ? new Date(expiredtime) : null
        const BanEndText = BanEnd ? msToYMDHMS(BanStart,BanEnd) : "無期限"
        const NowtoBanEndText = BanEnd ? msToYMDHMS(new Date(),BanEnd) : "無期限" 

        bds.sendCommand(`kick "${playername}" "あなたは「§l${reason}§r」により§l${BanStartText}§rから§l${BanEndText}§rの間BANされています。解除まで:§l${NowtoBanEndText}§r"`)
    };
    await message.reply({content:`${playername}を${reason}でBANしました`})
}
module.exports = ban