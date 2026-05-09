const { EmbedBuilder } = require("discord.js");
const { Types } =require("../../logger");
const { formatDate } = require("../../formatDate");

async function block(message,type,player,block,minutes,logm) {
    const conditions = []
    const params = []

    if (type) {
        conditions.push("actiontype=?")
        params.push(type === "place" ? Types.blockevents.actiontype.PlaceBlock : Types.blockevents.actiontype.BreakBlock)
    }
    if (player) {
        conditions.push("player=?")
        params.push(player)
    }
    if (block) {
        conditions.push("typeid=?")
        params.push(block)
    }
    if (minutes) {
        conditions.push("time >= ?")
        params.push(Date.now() - (minutes * 60 * 1000))
    }
    const sql = `SELECT * FROM blockevents ${conditions.length ? `WHERE ${conditions.join(" AND ")}`:""} ORDER BY time DESC LIMIT 30`

    const data = logm.db.prepare(sql).all(...params)
    const embed = new EmbedBuilder()
    embed.setTitle("絞り込み結果")
    embed.setTimestamp(new Date())
    let md = ""
    if (!data[0]) embed.setDescription("<Null>"); else {
        const num = (v)=>Number(v).toFixed(0)
        
        data.splice(0,50).forEach((v)=>{
            const time = new Date(v.time)
            const Type = v.actiontype === Types.blockevents.actiontype.PlaceBlock ? "設置" : "破壊"
            let dim
            if (v.dimension === Types.dimension.OverWorld) dim = "Overworld"
            if (v.dimension === Types.dimension.Nether) dim = "Nether"
            if (v.dimension === Types.dimension.TheEnd) dim = "TheEnd"
            const {player,typeid,x,y,z} = v
            md+=`- ${formatDate(time)}に、${player}が${typeid}を${Type}した(\`${num(x)} ${num(y)} ${num(z)}(${dim})\`)。\n\n`
        })
        embed.setDescription(md)
    }

    return await message.reply({embeds:[embed]})

}

module.exports = block