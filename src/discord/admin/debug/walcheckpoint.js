const { EmbedBuilder } = require("discord.js");
async function walcheckpoint(logm,message) {
    const embed = new EmbedBuilder()
    embed.setTimestamp(new Date())
    const res = logm.db.pragma(`wal_checkpoint(PASSIVE)`)
    const r = res[0]
    embed.setTitle(`WALcheckpoint - PASSIVE`)
    embed.setColor(0x96fff3)
    embed.setDescription(`を実行しました\n\n保存完了:\`${r.checkpointed}/${r.log}\`\nBusy:\`${r.busy}/${r.log}\``)
    await message.reply({embeds:[embed]})
}

module.exports = walcheckpoint