import { EmbedBuilder } from "discord.js"
import {Types} from "../../logger.js"
import { formatDate } from "../../formatDate.js" 

async function block(message,type,player,block,minutes,logm,dontskipTnt=false) {
    const conditions = []
    const params = []

    if (type) {
        conditions.push("actiontype=?")
        if (type === "place") params.push(Types.blockevents.actiontype.PlaceBlock);
        if (type === "break") params.push(Types.blockevents.actiontype.BreakBlock);
        if (type === "explode") params.push(Types.blockevents.actiontype.ExplodeBlock);
    } else if (!dontskipTnt) {
        conditions.push("actiontype != ?")
        params.push(Types.blockevents.actiontype.ExplodeBlock)
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
        
        data.forEach((v)=>{
            const time = new Date(v.time)
            let Type = "不明"
            if (v.actiontype === Types.blockevents.actiontype.PlaceBlock) Type = "設置"
            if (v.actiontype === Types.blockevents.actiontype.BreakBlock) Type = "破壊"
            if (v.actiontype === Types.blockevents.actiontype.ExplodeBlock) Type = "爆発"
            
            const dim = v.dimension
            const {player,typeid,x,y,z} = v
            md+=`- ${formatDate(time)}に、${player}が${typeid}を**${Type}**した\n-# (\`${num(x)} ${num(y)} ${num(z)}(${dim})\`)。\n\n`
        })
        embed.setDescription(md)
    }

    return await message.reply({embeds:[embed]})

}

export default block