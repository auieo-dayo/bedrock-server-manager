// Bedrock Server Wrapper  - Default-Server-Addon
import {CommandPermissionLevel, system , world, CustomCommandParamType, PlayerCursorInventoryComponent, Entity, BlockTypes, Player, EntityComponentTypes, DimensionType, DimensionTypes, EffectType, EffectTypes, EntityDamageCause, EntityComponent, EquipmentSlot, InputButton, GameMode, ItemType, ItemTypes, ItemComponentTypes } from"@minecraft/server";
import * as ui from "@minecraft/server-ui";
import { SecretString, transferPlayer } from "@minecraft/server-admin";
import * as net from "@minecraft/server-net"
let port = NaN





function btoa(str) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    let i;
    for (i = 0; i < str.length; i += 3) {
        let c1 = str.charCodeAt(i);
        let c2 = i+1 < str.length ? str.charCodeAt(i+1) : 0;
        let c3 = i+2 < str.length ? str.charCodeAt(i+2) : 0;

        let e1 = c1 >> 2;
        let e2 = ((c1 & 3) << 4) | (c2 >> 4);
        let e3 = ((c2 & 15) << 2) | (c3 >> 6);
        let e4 = c3 & 63;

        if (i+1 >= str.length) e3 = e4 = 64;
        else if (i+2 >= str.length) e4 = 64;

        result += chars.charAt(e1) + chars.charAt(e2) +
                  (e3 === 64 ? '=' : chars.charAt(e3)) +
                  (e4 === 64 ? '=' : chars.charAt(e4));
    }
    return result;
}
function atob(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    str = String(str).replace(/[=]+$/, '');

    for (let i = 0; i < str.length; i += 4) {
        let en1 = chars.indexOf(str[i]);
        let en2 = chars.indexOf(str[i + 1]);
        let en3 = chars.indexOf(str[i + 2]);
        let en4 = chars.indexOf(str[i + 3]);

        let chr1 = (en1 << 2) | (en2 >> 4);
        let chr2 = ((en2 & 15) << 4) | (en3 >> 2);
        let chr3 = ((en3 & 3) << 6) | en4;

        output += String.fromCharCode(chr1);
        if (en3 !== -1) output += String.fromCharCode(chr2);
        if (en4 !== -1) output += String.fromCharCode(chr3);
    }

    return decodeURIComponent(Array.prototype.map.call(output, (c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}


let BSW_SendPW = null



console.log(JSON.stringify({"type":"Request","cmd":"SyncConfRequest","source":``,"data":"","isEntity":false}))

function post(body,retry=0) {
    system.run(async()=>{
        if (!BSW_SendPW || !port) {
            console.error("Don't have SendPW")
            console.log(JSON.stringify({"type":"Request","cmd":"SyncConfRequest","source":``,"data":"","isEntity":false}))
        }

        try {
            if (!body.type) return
            const req = new net.HttpRequest(`http://localhost:${port || 3000}/api/bds/send`)
            req.setMethod("Post")
            req.addHeader("authorization",BSW_SendPW)
            req.addHeader('Content-Type', 'application/json')
            req.setBody(JSON.stringify(body))
            const res = await net.http.request(req)
            if (res.status !== 200) {
                if (retry < 3) return system.runTimeout(()=>post(body,retry+1),20*1)   
                console.error(`[Sending] - ${res.status}`)
                world.getDimension("overworld").runCommand(`titleraw @a actionbar {"rawtext":[{"text":"§a送信に失敗しました:${res.status}\n管理者に連絡してください..."}]}`)
            }
            if (res.status == 401 || res.status == 111) console.log(JSON.stringify({"type":"Request","cmd":"SyncConfRequest","source":``,"data":"","isEntity":false}))
        } catch(e) {
            console.error(e.message)
            world.getDimension("overworld").runCommand(`titleraw @a actionbar {"rawtext":[{"text":"§a送信に失敗しました\n管理者に連絡してください..."}]}`)
        }
    })
}


function syncPlayer() {
    const players = world.getAllPlayers().map((p)=>({"name":p.name,"tags":p.getTags()}))
    post({"type":"syncplayerlist","data": players})
}

// プレイヤー退出ログ

world.beforeEvents.playerLeave.subscribe((ev)=>{
    const player = ev.player
    console.log(JSON.stringify({"type":"Logger","cmd":"playerLeave","source":`${player.name}(${player.location.x} ${player.location.y} ${player.location.z})`,"data":`${player.dimension.id}`,"isEntity":true}))
})

// チャットを送信
world.beforeEvents.chatSend.subscribe((ev)=>{
    const msg = ev.message
    const sender = ev.sender
    const body = {"type":"chat","sender":sender.name,msg}
    post(body)

    if (msg.startsWith("!debug ") && sender.hasTag("admin")) {
        
        const cmd = msg.replace("!debug ","")
        sender.sendMessage(`debug....${cmd}`)
        switch(cmd) {
            default:
                break;
        }
    }
})

// 死亡ログを送信
world.afterEvents.entityDie.subscribe((ev)=>{
    const source = ev.damageSource
    const die = ev.deadEntity

    if (die.typeId != "minecraft:player") return
    const cause = source.cause
    let info = ""
    if (source.damagingProjectile) {
        info = source.damagingProjectile.typeId
    }
    if (source.damagingEntity) {
        if (source.damagingEntity.typeId == "minecraft:player") {
            if (info != "") info+= "|"
            info += source.damagingEntity.name
        } else {
            if (info != "") info+= "|"
            info += source.damagingEntity.typeId
        }
    }
    const location = die.location

    const body = {"type":"death","source":`${die.name}`,"reason":`${cause}(${info})`,location,dim:die.dimension.id}
    post(body)
})
world.afterEvents.playerPlaceBlock.subscribe((ev)=>{
    post({
        type:"blockEvent",
        action:0,
        typeid: ev.block.typeId,
        dim: ev.dimension.id,
        source: ev.player.name,
        location: ev.block.location
    })
})

world.beforeEvents.playerBreakBlock.subscribe((ev)=>{
    post({
        type:"blockEvent",
        action:1,
        typeid: ev.block.typeId,
        dim: ev.dimension.id,
        source: ev.player.name,
        location: ev.block.location
    })
})

world.beforeEvents.explosion.subscribe((ev)=>{
    const explosionMob = ev.source
    const explosionPosition = ev.source.location
    const blocks = ev.getImpactedBlocks().map((v)=>({typeid:v.typeId,location:v.location})).filter((v)=>v.typeid !== "minecraft:air")

    post({
        type:"blockEvent",
        action:2,
        // typeid: ev.block.typeId,
        dim: ev.dimension.id,
        source: explosionMob.typeId,
        location: explosionMob.location,
        blocks
    })
})

// プレイヤーリスト同期
system.runInterval(()=>{
    syncPlayer()
},20*60*10)


// コマンド

system.beforeEvents.startup.subscribe((ev)=>{
    
    // アラート
    console.log("[BSW-ADDON-ALEART] ===========================================================")
    console.log("[BSW-ADDON-ALEART] BSWを使用しない場合はこのアドオンを抜くことを強く推奨します")
    console.log("[BSW-ADDON-ALEART] ===========================================================")

    ev.customCommandRegistry.registerCommand({
        name:"auieo:backup",
        description:"バックアップ開始指示を送ります...",
        permissionLevel : CommandPermissionLevel.GameDirectors,
        mandatoryParameters:[
        ],
        optionalParameters:[
            {name:"auieo:isfull",type:CustomCommandParamType.Boolean}
        ]
    },(origin, arg) => {
        system.runTimeout(() => {
            let name = ""
            if (typeof origin.sourceEntity != "undefined") {
                name = origin.sourceEntity.name
            }
            let entity = true
            if (!origin?.sourceEntity || !(origin?.sourceEntity instanceof Player)) entity = false
            let isfull = false
            if (arg) {
                isfull = true
            }
            const body = {"type":"backup","source":`${name}`,isfull,"isEntity":entity}
            post(body)
            if (entity) origin.sourceEntity.sendMessage("§aバックアップ開始指示を送りました...")
        })
      })
    ev.customCommandRegistry.registerCommand({
        name:"auieo:backuplist",
        description:"バックアップのリストを送ります...",
        permissionLevel : CommandPermissionLevel.GameDirectors,
        mandatoryParameters:[
        ],
        optionalParameters:[
        ]
    },(origin, arg) => {
        system.runTimeout(() => {
            if (!origin?.sourceEntity || !(origin?.sourceEntity instanceof Player)) return
            console.log(JSON.stringify({"type":"servercommand","cmd":`backuplist`,"source":origin.sourceEntity.name,"data":"","isEntity":true}))
        })
      })
    ev.customCommandRegistry.registerCommand({
        name:"auieo:addonreload",
        description:"デフォルトアドオンのコピーとすべてのアドオンの再読み込みを行います...",
        permissionLevel : CommandPermissionLevel.GameDirectors,
        mandatoryParameters:[
        ],
        optionalParameters:[
        ]
    },(origin, arg) => {
        system.runTimeout(() => {
            let name = ""
            if (typeof origin.sourceEntity != "undefined") {
                name = origin.sourceEntity.name
            }
            let entity = true
            if (!origin?.sourceEntity || !(origin?.sourceEntity instanceof Player)) entity = false
            console.log(JSON.stringify({"type":"servercommand","cmd":"reloadaddon","source":name,"data":"","isEntity":entity}))

        })
      })
    ev.customCommandRegistry.registerCommand({
        name:"auieo:send",
        description:"BDSへ情報を送るためのコマンド",
        permissionLevel : CommandPermissionLevel.Owner,
        mandatoryParameters:[
            {"name":"data","type":CustomCommandParamType.String}
        ],
        optionalParameters:[
        ]
    },(origin, arg) => {
        system.runTimeout(() => {
            const json = JSON.parse(arg.replace(/'/g, '"'))
            if (json.type === "chat") {
                if (!json.data) return;
                const text = atob(json.data);
                const rawtext = {rawtext:[{text}]}
                world.sendMessage(rawtext)
            } else if (json.type == "backuplist") {
                const {source,data} = json
                let text = "§aバックアップリスト(本日分)"
                const today = []
                for (const p of world.getAllPlayers()) {
                    if (p.name == source) {
                        for (const d of data.todaybackuplist) {
                            today.push(d)
                            text+=`\n${d.fullpathja}`
                        }
                        text+=`\n全期間:${data.allbackup} | 本日分:${today.length}`
                        p.sendMessage(text)
                    }
                }
            } else if (json.type == "getplayerinfo") {
                const {playername} = json
                
                const returnjson = {"type":"playerinfo",playername,"iserr":false,"data": {
                    "dimension": "",
                    "location": {"x": NaN,"y": NaN,"z": NaN},
                    "hp": {"now":NaN,"max":20},
                    "gamemode": "",
                    "mainhand": ""
                }}

                const player = world.getAllPlayers().find((p)=>{
                    return p.name == playername
                })

                if (!player) returnjson.iserr = true; else {

                    returnjson.data.dimension = player.dimension.id
                    returnjson.data.location = player.location
                    returnjson.data.hp.now = player.getComponent("minecraft:health").currentValue.toFixed(0)
                    returnjson.data.gamemode = player.getGameMode()
                    const mainhand = player.getComponent(EntityComponentTypes.Equippable).getEquipment(EquipmentSlot.Mainhand)
                    returnjson.data.mainhand = mainhand?.typeId ?? "Null"

                }
                post(returnjson)
            } else if (json.type == "syncConf") {
                const pass = json.data.pass
                port = json.data.port
                BSW_SendPW = new SecretString(`Basic ${btoa(`BDS_Send:${pass}`)}`)
                console.log(`Catch SendPW`)
            }
        })
      })
})
