import { MessageFlags } from "discord.js"
function p(bds,message,content){
    message.reply({content:"取得中...",flags:MessageFlags.SuppressNotifications})
    const json = JSON.stringify({"type":"getplayerinfo","playername":content}).replaceAll("\"","'").replaceAll("\\","\\\\'")
    bds.sendCommand(`send "${json}"`,true)
}
export default p