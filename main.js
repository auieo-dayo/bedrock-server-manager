// Bedrock Server Wrapper
const path = require("path")
const WebSocket = require('ws');
const dotenv = require("dotenv");
dotenv.config();
const PropertiesReader = require('properties-reader');
const fs = require("fs-extra")
const chalk = require('chalk');
const discord = require("discord.js")
const { v4: uuidv4 } = require('uuid');


const wslimit = require('./src/wslatelimit');
const wstoken = require('./src/wstoken');
const wst = new wstoken(60000)
const config = require('./config/config');
const playerstore = require("./src/playerList")
const BanManager = require("./src/ban")
const discordCommands = require('./src/discord/commands');
const { setCommands } = require("./src/discord/setGuildCommands")
const {formatDate,msToYMDHMS} = require("./src/formatDate")
const BDS = require("./src/BDS")
const Backup = require("./src/backup")
const Logger = require("./src/logger")
const betaApi = require("./src/enableBetaApi")


// project-root

const root = __dirname

// Backup Setting

const BackupInterval = config.backup.interval


// BDS Online Players

const onlinePlayer = new playerstore()


// BDS Paths

const BDS_path = path.join(root,"bds")
const BDS_file =
  process.platform === "win32"
    ? path.join(BDS_path, "bedrock_server.exe")
    : path.join(BDS_path, "bedrock_server")


let worldname = process.env["level-name"]
let servername = process.env["server-name"]

// time

const dbpath = path.join(__dirname,"datas","app.db")
fs.ensureDirSync(path.dirname(dbpath))
const logm = new Logger.Logger(dbpath)

const BSWVer = require("./package.json").version
// StartupText
console.log(chalk.bgBlue(`BSW By auieo-dayo\nVersion:${BSWVer}`))
logm.Server(`BSW by auieo-dayo | Ver:${BSWVer}`,true)

// BDS Check
if (!fs.pathExistsSync(BDS_file)) {
  console.error(chalk.bgRed("BDSの存在を確認できませんでした。"))
  process.exit(1)
}




// BDS properties Path

const properties_path = path.join(BDS_path,"server.properties")
const properties = PropertiesReader(properties_path);

// BDS properties edit

const env_list = [
  "server-name",
  "gamemode",
  "difficulty",
  "allow-cheats",
  "max-players",
  "server-port",
  "server-portv6",
  "level-seed",
  "level-name"
]

for (const item of env_list) {
if (typeof process.env[item] == "undefined") continue;
properties.set(item,process.env[item])
}
properties.set("content-log-console-output-enabled","true")
properties.save(properties_path);


// default_server_addon module config

const DSD_modules = [
    "@minecraft/server",
    "@minecraft/server-ui",
    "@minecraft/server-admin",
    "@minecraft/server-net"
]
const DSD_modules_path = path.join(BDS_path,"config","default","permissions.json")
const nowDSD_modules = fs.readJSONSync(DSD_modules_path)
DSD_modules.map((item)=>{
  if (!nowDSD_modules.allowed_modules.includes(item)) {
    nowDSD_modules.allowed_modules.push(item)
  }
})
fs.writeJSONSync(DSD_modules_path,nowDSD_modules)



// WebServer
const express = require('express');
const app = express();
const http = require("http");
const server = http.createServer(app);

const basicAuth = require('express-basic-auth');

const PORT = config.webUi.port;

const os = require('os');
const { getCpuUsage } = require("./src/cpuusage");
const { default: rateLimit } = require('express-rate-limit');


app.set('trust proxy', config.webUi.trustProxy);




// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // 全オリジン許可
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // プリフライト対応
  }
  next();
});

// JSON
app.use(express.json());

// BDS Send Basic

// Passwordの生成
const BDSsendPass = uuidv4();


app.use('/api/bds/',(req,res,next)=>{
  if (!["127.0.0.1","::1","::ffff:127.0.0.1"].includes(req.socket?.remoteAddress)) return res.sendStatus(404);
  next()
})
app.use('/api/bds/', basicAuth({
  users: { "BDS_Send" : `${BDSsendPass}` },
  challenge: false,           // 認証ダイアログを出す
  realm: 'BDS-Send-Path-Login'         // ダイアログに表示される領域名
}));
app.post('/api/bds/send',async (req,res,next)=>{
  try {
    const body = req.body
    if (typeof body.type != "string") {
      return res.status(400).type("json").send({"status":false})
    }

    switch(body.type) {
      case "chat":{
        const {msg,sender} = body
        chatmng.sendtoDis(sender,msg)
        res.status(200).type("json").send({"status":true})
        break;
      }
      case "death":{
        const {source,reason,location,dim} = body
        DeathtoDis(source,reason)
        logm.Death(source,reason,location,dim)

        res.status(200).type("json").send({"status":true})
        break;
      }
      case "backup":{
        const {source,isfull,isEntity} = body
        const list = await backup.waitForPreparationsComplete(bds)
        if (isfull) {
          await backup.backup(list,true,true,onlinePlayer,bds)
          if (isEntity && source) bds.sendCommand(`tellraw ${source} {"rawtext":[{"text":"§cFull Backup Success"}]}`)
        } else {
          await backup.backup(list,false,true,onlinePlayer,bds)
          if (isEntity && source) bds.sendCommand(`tellraw ${source} {"rawtext":[{"text":"§cBackup Success"}]}`)
        }
        res.status(200).type("json").send({"status":true})
        break;
      }
      case "playerinfo": {
        PlayerinfotoDis(body)
        res.status(200).type("json").send({"status":true})
        break;
      }
      case "syncplayerlist": {
        const data = body?.data
        if (Array.isArray(data) && data.every(item => 
          typeof item === "object" &&
          item !== null &&
          typeof item.name === "string" &&
          Array.isArray(item.tags) &&
          item.tags.every(tag => typeof tag === "string")
        )) {
          onlinePlayer.fullSync(data)
        }
        res.status(200).type("json").send({"status":true})
        
        break;
      }
      case "blockEvent": {
        if (![0,1].includes(body.action)) return res.status(400).type("json").send({"status":false});

        const {typeid,dim,player,location,action} = body

        if (action === 0) logm.PlaceBlock(player,typeid,dim,location)
        if (action === 1) logm.BreakBlock(player,typeid,dim,location)
        res.status(200).type("json").send({"status":true})
        break;
      }
      default:{
        res.status(400).type("json").send({"status":false})
        break;
      }
    }
    
  } catch(err) {
    next(err)
  }
})


// lateLimit
const limit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 200, // 最大200リクエスト
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/',limit)

//  Basic
if (config.webUi.basicAuth.enable) {
  app.use('/', basicAuth({
    users: { [config.webUi.username ?? "admin"] : config.webUi.password ?? "admin" },
    challenge: true,           // 認証ダイアログを出す
    realm: 'BSW-DashBoard-Login'         // ダイアログに表示される領域名
  }));
} else console.log(chalk.bgGreen("[WEB] DISABLED BASICAUTH"))

app.get('/api/getwstoken',(req,res,next)=>{
  try {
    const token = wst.gettoken()
    return res.type("json").send(JSON.stringify({token},null,2)) 
  }catch(err) {
    next(err)
  }
})

app.get('/api/getbdspw', async (req, res, next) => {
  try {
    const json = {"password": BDSsendPass}
    res.type("json").send(JSON.stringify(json,null,2))
  }catch (err) {
    next(err)
  }
  
});

app.get('/api/getlog', async (req, res, next) => {
  try {
    const {_l} = req.query
    let limit = Number(_l)
    if (Number.isNaN(limit)) limit=300
    if (limit <= 0 || limit > 1000) limit = 1000
    const prepare = logm.db.prepare(`SELECT * FROM events ORDER BY time DESC LIMIT ?`)
    const content = prepare.all(Number(limit))
    
    const types = Object.keys(Logger.Types.events)

    const logs = content.map((value)=>{
      const type = types[value.type]

      const metadata = JSON.parse(value.metadata)

      const json = {
        type,
        data: value.message,
        time: value.time
      }
      // BDSはデフォでいいからスキップ
      if (type == "chat") {
        json.player = value.player
        json.message = metadata.message
        json.source = metadata.isdiscord ? "Discord" : "Minecraft";
      }
      if (type == "PlayerJoin" || type == "PlayerLeave") {
        json.data = value.player
      }
      // cmdもデフォ
      if (type == "death") {
        json.player = value.player
        json.reason = metadata.reason
        json.location = metadata.location,
        json.dimension = metadata.dimension
      }
      // serverもスキップ
      return json 
    })
    logs.sort((a,b)=>a.time - b.time)
    res.type("json").send(JSON.stringify(logs,null,2))
  }catch (err) {
    next(err)
  }
  
});

async function getinfo() {
    const cpu = await getCpuUsage(100)
    return {
      "BDS": {
        "servername":`${process.env["server-name"]}`,
        "levelname":`${process.env["level-name"]}`,
        "gamemode": `${process.env["gamemode"]}`,
        "difficulty":`${process.env["difficulty"]}`,
        "player": {
          "max": Number(process.env["max-players"]),
          "now": onlinePlayer.getAll().length
        },
        "version": bds.BDSver
      },
    "server": {
      "mem": {
        "free": os.freemem()/1073741824,
        "total": os.totalmem()/1073741824,
        "par": 100-((os.freemem() / os.totalmem()) * 100)
      },
      "cpu": {
        "par": cpu
      },
      BSWVer
    }
    }
}


app.get('/api/dashboard',async(req,res,next)=>{
  try {
    const info = await getinfo()
    const onlines = onlinePlayer.getAll()
    const blist = await backup.getlist("",false)
    res.type("json").send({info,onlines,backups:blist.data})
  }catch(e){
    next(e)
  }
})

// BlockEvents
app.get('/api/blockevents',async(req,res,next)=>{
  try {
    const {actiontype,player,block,minutes} = req.query
    const conditions = []
    const params = []
    if (actiontype) {
        conditions.push("actiontype=?")
        params.push(actiontype === "place" ? Logger.Types.blockevents.actiontype.PlaceBlock : Logger.Types.blockevents.actiontype.BreakBlock)
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
    const sql = `SELECT * FROM blockevents ${conditions.length ? `WHERE ${conditions.join(" AND ")}`:""} ORDER BY time DESC LIMIT 50`
    const data = logm.db.prepare(sql).all(...params)
    const json = data.map((v)=>{return {
      time: new Date(v.time).getTime(),
      action: v.actiontype,
      dimension: v.dimension,
      location: {x:v.x,y:v.y,z:v.z},
      block: v.typeid,
      player: v.player
    }})
    res.type("json").send(JSON.stringify(json,null,2))
  } catch(e) {next(e)}
})

app.get('/api/nowonline', (req, res) => {
  res.type("json").send(JSON.stringify(onlinePlayer.getAll(),null,2))
});

app.get('/api/info', async (req, res, next) => {
  try {
    res.type("json").send(JSON.stringify(await getinfo(),null,2))

  } catch(err) {
    next(err);
  }
});

app.get('/api/backuplist', async(req, res, next) => {
  try {
    const blist = await backup.getlist("",false)
    res.type("json").send(JSON.stringify(blist.data,null,2))
  }catch(err) {
    next(err)
  }
});


app.use(express.static(path.join(root,"www")))

app.use((err, req, res,next) => {
  console.error(chalk.red('[WEB ERROR]'), err);
  if (res.headersSent) return next(err);
    res.status(500).json({
      error: 'internal_error',
      message: err.message
    });
});


// Websocket Server

const wss = new WebSocket.Server({ noServer: true, path: "/ws" });

if (config.console.bswSystemLogToConsole) console.log(chalk.bgBlue(`WebSocket Ready`))

const wsl = new wslimit(60000,10)
server.on("upgrade", (req, socket, head) => {
  if (!wsl.limit(req,socket)) return

  const url = new URL(req.url, `http://${req.headers.host}`);

  const token = url.searchParams.get("token");
  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    return socket.destroy();
  }
  
  const res = wst.use(token)
  if (!res.passed) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    return socket.destroy();
  }

  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit("connection", ws, req);
  });
});



wss.on('connection', (ws) => {

ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message)
      if (msg.type == "cmd") {
        bds.sendCommand(`${String(msg.data)}`)
      }
      if (msg.type == "servercmd") {
        if (msg.data == "playerlist") {
          ws.send(JSON.stringify({"type":"server","datatype":"playerlist","data":onlinePlayer.getAll()}))
        } else if (msg.data == "backup") {
          ws.send(JSON.stringify({"type":"server","datatype":"str","data":"BackupStarted"}));
          (async()=>{
            const list = await backup.waitForPreparationsComplete(bds)
            await backup.backup(list,false,true,onlinePlayer,bds)
          })()
        }
      }
    } catch(e) {
      console.error(chalk.red(e.message))
    }
  });
});



const start = async () => {
  server.listen(PORT,"0.0.0.0",() => {
    if (config.console.bswSystemLogToConsole) console.log(chalk.bgBlue(`WebServer&WebSocket Ready(http://localhost:${PORT})`))
  });
};

start();

function WSbroadcast(json) {
  wss.clients.forEach ((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(json));
    }
  });
}

// Discord

const client = new discord.Client({
    intents: [
      discord.GatewayIntentBits.Guilds, // サーバーに関するイベント
      discord.GatewayIntentBits.GuildMessages, // メッセージ関連
      discord.GatewayIntentBits.MessageContent, // メッセージの内容を取得（超重要！）
    ]
  });

async function sendLongMessage(channel, text, limit = 2000) {
try {
  for (let i = 0; i < text.length; i += limit) {
    await channel.send(text.slice(i, i + limit));
  }
}catch(e){
  console.log(`[SLM-Error]${e.message}`)
}
}


/**
 * @type {{
 *   chat: import("discord.js").TextChannel,
 *   serverStatus: import("discord.js").TextChannel
 *   admin: import("discord.js").TextChannel
 * }}
 */
const channels = {
  "chat": null,
  "serverStatus": null,
  "admin": null
}

async function LLtoDis(name,type) {
  if (!channels.chat) return
  if (!client.isReady()) return
  if (!config.Discord.notifications.chat.enabled) return
  let hex
  if (type === "logout") {
    type = "ログアウトしました"
    hex = 0xD20000
  } else if (type === "join") {
    type = "ログインしました"
    hex = 0x00bd0f
  }
  const embed = new discord.EmbedBuilder()
  .setTitle(`${name}が${type}`)
  .setDescription(`[${servername}]${worldname}`)
  .setColor(hex)
  .setTimestamp(new Date())
  await channels.chat.send({ embeds: [embed] });
}

async function DeathtoDis(name,data) {
  WSbroadcast({ type: "death", data: `${name}(${data})`})
  if (config.console.deathLogToConsole) console.log(chalk.magenta(`${name}(${data})`))
  if (!client.isReady()) return
  if (!channels.chat) return
  if (!config.Discord.notifications.chat.playerDeath) return
  const embed = new discord.EmbedBuilder()
  .setTitle(`${name}(${data})`)
  .setDescription(`[${servername}]${worldname}`)
  .setColor(0xad0000)
  .setTimestamp(new Date())
  await channels.chat.send({ embeds: [embed] });
}

async function PlayerinfotoDis(json) {
  if (!client.isReady()) return
  if (!channels.admin) return
  if (!config.Discord.notifications.toAdmin.playerInfo.enabled) return

  const {playername,iserr,data} = json

  const embed = new discord.EmbedBuilder()
    .setTimestamp(new Date())

  if (iserr) {
    embed.setTitle(`[${playername}]が見つかりませんでした`)
      const res = logm.db.prepare(`SELECT * FROM events WHERE type = ${Logger.Types.events.PlayerLeave} AND player = ? ORDER BY time DESC LIMIT 1`).get(playername)
      
      if (res) {
        const date = new Date(res.time)
        const metadata = JSON.parse(res.metadata)
        const dateja = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}時${String(date.getMinutes()).padStart(2, "0")}分${String(date.getSeconds()).padStart(2, "0")}秒`
        embed.setDescription(`[${playername}]の最終ログアウト情報\nログアウト場所:${metadata.location.x.toFixed(0)} ${metadata.location.y.toFixed(0)} ${metadata.location.z.toFixed(0)}\nログアウト時刻:${dateja}`)
      }  else {
        embed.setDescription(`[${playername}]の最終ログアウト情報が見つかりませんでした。`)
      }
    
    embed.setColor(0xed0000)
  } else {
    embed.setTitle(`[${playername}]の基本情報`)
    const dim = `Dimension: \`${data.dimension}\``
    const location = `Location: \`${data.location.x.toFixed(0)} ${data.location.y.toFixed(0)} ${data.location.z.toFixed(0)}\``
    const hp = `HP: \`${data.hp.now}/${data.hp.max}\``
    const gm = `GameMode: \`${data.gamemode}\``
    const mainhand = `MainHandItem: \`${data.mainhand}\``
    embed.setDescription(`${dim}\n${location}\n${hp}\n${gm}\n${mainhand}`)
    embed.setColor(0xabd656)
  }
  await channels.admin.send({ embeds: [embed] });
}

const parseMessageFromMC = (msg="")=>msg.replaceAll("<@","<@ ")
  .replaceAll("<&","<& ")
  .replaceAll("@everyone","@ everyone")
  .replaceAll("@here","@ here")
  .replaceAll("discord.gg/","discord .gg")

const chatmng = {
  "sendtoMC": async(name,message) => {
    if (config.console.chatLogToConsole) console.log(chalk.yellow(`[D]${name}:${message}`))
    const returnText = `§3[D]${name}§r:${message}`
    logm.Chat(name,true,message)
    WSbroadcast({ type: "chat", data: `[D]${name}:${message}`})
    const rawtext = {"rawtext":[{"text":`${returnText.replace(/\n/g,"\\n")}`}]}
    if (onlinePlayer.getAll().length != 0) bds.sendCommand(`tellraw @a ${JSON.stringify(rawtext)}`,true)

  },
  "sendtoDis": async(name,message) => {
    if (config.console.chatLogToConsole) console.log(chalk.yellow(`${name}:${message}`))
    const returnText = `\`${name}\`:${parseMessageFromMC(message)}`

    WSbroadcast({ type: "chat", data: `${name}:${message}`})
    logm.Chat(name,false,message)

    if (!config.Discord.notifications.chat.enabled) return
    if (!client.isReady()) return
    sendLongMessage(channels.chat,returnText)
  }
}
const sendStartEmbed= async()=>{
  const serverStartEmbed = new discord.EmbedBuilder()
  .setTitle("サーバーがスタートしました。")
  .setDescription(`[${servername}]${worldname}`)
  .setColor(0x6ff542)
  .setTimestamp(new Date())
  await channels.serverStatus.send({embeds:[serverStartEmbed]})
}
let discordstarted = false
client.once(discord.Events.ClientReady, async () => {
    if (config.console.bswSystemLogToConsole) console.log(chalk.bgBlue(`[Discord]Login success: ${client.user.tag}`));
    
    // Channel取得
    try {
        if (config.Discord.notifications.chat.enabled) {
          channels.chat = await client.channels.fetch(`${config.Discord.notifications.chat.channelId}`,{force: true,allowUnknownGuild: true});
        }

        if (config.Discord.notifications.toAdmin.enabled) {
          channels.admin = await client.channels.fetch(`${config.Discord.notifications.toAdmin.channelId}`,{force: true,allowUnknownGuild: true});
        }

        await setCommands(client,config.Discord.guildId)

        if (config.Discord.notifications.serverStatus.enabled) {
          channels.serverStatus = await client.channels.fetch(`${config.Discord.notifications.serverStatus.channelId}`,{force: true,allowUnknownGuild: true});
          await sendStartEmbed()
          discordstarted = true
        }

    } catch (error) {
        console.error(chalk.red(`${error}`));
    }
});


// Discordチャットイベント
client.on(discord.Events.MessageCreate, message => {
  if (message.channelId == config.Discord.notifications.chat.channelId) {
    if (message.author.bot) return;
    // helpなら
    if (message.content == "?help") {
      const commands = {
        "help": {
          "enabled": true,
          "prefix": ["?help"],
          "description": "このヘルプを表示します。"
        },
        "playerlist": {
          "enabled": true,
          "prefix": ["?pl","?playerlist"],
          "description": "プレイヤーリストを表示します。"          
        }
      }
      const md = Object.entries(commands)
          .filter(([_, cmd]) => cmd.enabled)
          .map(([name, cmd]) =>
            `\`${name}\`**${cmd.prefix.join(" | ")}**\n${cmd.description}`
          )
          .join("\n\n")
      return message.reply(`# Helps\n${md}`)
    }
    // PlayerListなら
    if (message.content == "?playerlist" || message.content == "?pl") return discordCommands.chat.pl(onlinePlayer,message);

    // チャットを送信
    chatmng.sendtoMC(message.author.displayName,message.content)


    // 管理者用ディスコチャンネルなら
    } else if (message.channelId == config.Discord.notifications.toAdmin.channelId && config.Discord.notifications.toAdmin.enabled) {
      // helpなら
      if (message.content == "?help") {
        const commands = {
          "help": {
            "enabled": true,
            "prefix": ["?help"],
            "description": "このヘルプを表示します。"
          },
          "playerinfo": {
            "enabled": config.Discord.notifications.toAdmin.playerInfo.enabled,
            "prefix": config.Discord.notifications.toAdmin.playerInfo.prefix,
            "description": "簡単なプレイヤーの情報を取得します。"          
          },
          "deathinfo": {
            "enabled": config.Discord.notifications.toAdmin.deathInfo.enabled,
            "prefix": config.Discord.notifications.toAdmin.deathInfo.prefix,
            "description": "最新十件で死亡場所等を取得します"
          },
          "BAN": {
            "enabled": config.Discord.notifications.toAdmin.ban.enabled,
            "prefix": config.Discord.notifications.toAdmin.ban.prefix,
            "description":"BAN系の操作(list,isbanned,ban,pardon)"
          }
        }
       const md = Object.entries(commands)
            .filter(([_, cmd]) => cmd.enabled)
            .map(([name, cmd]) =>
              `\`${name}\`**${cmd.prefix.join(" | ")}**\n${cmd.description}`
            )
            .join("\n\n")
        message.reply(`# Helps\n${md}`)
      }
      
      // playerinfo プレフィックスで始まっていたら
      if (config.Discord.notifications.toAdmin.playerInfo.enabled && config.Discord.notifications.toAdmin.playerInfo.prefix.some(pre => message.content.startsWith(pre))) {
        const prefix = config.Discord.notifications.toAdmin.playerInfo.prefix.find(pre =>
          message.content.startsWith(`${pre} `)
        )
        if (prefix) {
          const content = message.content.slice(prefix.length+1)
          discordCommands.admin.p(bds,message,content)
        }
     } 

      // deathinfo プレフィックスで始まっていたら
      if (config.Discord.notifications.toAdmin.deathInfo.enabled && config.Discord.notifications.toAdmin.deathInfo.prefix.some(pre => message.content.startsWith(pre))) {
        const prefix = config.Discord.notifications.toAdmin.deathInfo.prefix.find(pre =>
          message.content.startsWith(`${pre} `)
        )
        if (prefix){ 
          const content = message.content.slice(prefix.length+1)
          discordCommands.admin.d(content,message,channels.admin,logm)
        }
      }

      // BAN プレフィックスで始まっていたら
      if (config.Discord.notifications.toAdmin.ban.enabled && config.Discord.notifications.toAdmin.ban.prefix.some(pre => message.content.startsWith(pre))) {
        const prefix = config.Discord.notifications.toAdmin.ban.prefix.find(pre =>
          message.content.startsWith(`${pre} `) 
        )
        if (prefix){ 
          const content = message.content.slice(prefix.length+1).trim().split(/\s+/);
          if (!content[0]) {
            return sendLongMessage(channels.admin,"# list,isbanned,ban,pardonを指定してください")
          }
          switch(content[0]) {
            case "list": return discordCommands.admin.ban.list(bm,message)
            case "isbanned": return discordCommands.admin.ban.isbanned(bm,content[1],message)
            case "ban": return discordCommands.admin.ban.ban(content[1],content[2],bm,onlinePlayer,bds,message,{author:message.author,isdiscord:true})
            case "pardon": return discordCommands.admin.ban.pardon(content[1],bm,message)
            case "help": return message.reply({content:"# BanHelp\nlist\nisbanned `<playername>`\nban `<playername>` `<reason>`\npardon `<playername>`"})
          }
        }
      }
    }

});

/**
 * @type {{ data: {value:number, name:string}[], last: number }}
 */
const backupCache = {data:[],last:0}
async function getBackupCache() {
  const diff =  Date.now() - backupCache.last
  if (1000*30 <= diff) {
    const list = await backup.getlist(null,true)
    backupCache.data = list.data.fullbackuplist.map((v)=>{
      const Bdate = new Date(`${v.date.yyyy}/${v.date.MM}/${v.date.dd} ${v.date.hh}:${v.date.mm}:${v.date.ss}`)
      const j = {value:String(Bdate.getTime()),name:v.fullpathja}
      return j
    })
    backupCache.last = Date.now()  
  }
  return backupCache.data
  
}

const Blocks = {list:new Set(),last:0}
function getBlocks() {
  const diff =  Date.now() - Blocks.last
  if (1000*60*10 <= diff) {
    const res = logm.db.prepare(`SELECT DISTINCT typeid FROM blockevents`).all()
    Blocks.list = new Set(res.map(v=>v.typeid))
    Blocks.last = Date.now()
  }
  return Blocks.list
}

// Discordイベント
client.on(discord.Events.InteractionCreate,async (interaction)=>{
  const { channel } = interaction
  // 対象サーバー以外ならスキップ
  if(config.Discord.guildId !== channel.guildId) return
  // AutoCompleteの設定
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused(true);
    const commandName = interaction.commandName
    // BlockEventsのAutoComplete
    if (focused.name == "block" && commandName == "block") {
      const q = focused.value.toLowerCase()
      /**
       * @type {string[]}
       */
      const blocks = [...getBlocks()]
      const starts = blocks.filter(v =>{
        return v.toLowerCase().startsWith(q) || v.toLowerCase().replace("minecraft:","").startsWith(q)
      })
      const includes = blocks.filter(v => {
        const lower = v.toLowerCase()
        const clean = lower.replace("minecraft:", "")

        return (
          !lower.startsWith(q) &&
          !clean.startsWith(q) &&
          (
            lower.includes(q) ||
            clean.includes(q)
          )
        )
      })

      const result = [...starts, ...includes].slice(0,25).map((v)=>{return {name:v,value:v}})
            
      return await interaction.respond(result)
    }
    // BackupのAutoComplete
    if (focused.name == "target" && commandName == "backup") {
      const cachelist = await getBackupCache()
      let blist = [...cachelist].sort((a,b)=>Number(b.value) - Number(a.value))
      if (focused.value) {
        blist = blist.filter((v)=>`${v.value}`.startsWith(focused.value))
      }
      blist = blist.slice(0,25)
      return await interaction.respond(blist)
    }
  }

  // コマンド以外ならreturn

  if (!interaction.isCommand()) return;
  const { commandName } = interaction;  
  // PlayerListの場合
  if (commandName == "pl" && [config.Discord.notifications.chat.channelId,config.Discord.notifications.toAdmin.channelId].includes(channel.id)) return await discordCommands.chat.pl(onlinePlayer,interaction);

  // 以降はAdminチャンネル用コマンドだからここでチェック
  if (channel.id !== config.Discord.notifications.toAdmin.channelId) return


  // PlayerInfo
  if (commandName == "p" && config.Discord.notifications.toAdmin.playerInfo.enabled) {
    const gamertag = interaction.options.getString("gamertag")
    return await discordCommands.admin.p(bds,interaction,gamertag)
  }
  // DeathInfo
  if (commandName == "d" && config.Discord.notifications.toAdmin.deathInfo.enabled) {
    const gamertag = interaction.options.getString("gamertag")
    await discordCommands.admin.d(gamertag,interaction,channel,logm)
  }
  // Backup系
  if (commandName === "backup") {
    const sub = interaction.options.getSubcommand();
    if (sub === "backup") {
      const isfull = interaction.options.getBoolean("isfull")? true : false
      await interaction.deferReply({content:`${isfull ? "フル":"差分"}バックアップ中...`})
      discordCommands.admin.backup.backup(isfull,backup,interaction,bds,onlinePlayer)
    }else if (sub == "restore") {
      const target = interaction.options.getString("target")
      await interaction.deferReply({content:`復元中...`})
      discordCommands.admin.backup.restore(backup,target,interaction,bds)
    }else if (sub == "list") {
      const target = interaction.options.getString("target")
      await interaction.deferReply({content:`復元中...`})
      await discordCommands.admin.backup.list(backup,interaction,target)
    }
  }
  // Ban系
  if (commandName === "ban") {

    const sub = interaction.options.getSubcommand();
    
    if (sub === "list") return await discordCommands.admin.ban.list(bm,interaction)
    const gamertag = interaction.options.getString("gamertag")
    
    if (sub === "ban") {
      const reason = interaction.options.getString("reason")
      const expired = interaction.options.getNumber("expired")
      let expiredtime = Date.now()
      if (expired) expiredtime+=expired*60*60*1000
      return await discordCommands.admin.ban.ban(gamertag,reason,bm,onlinePlayer,bds,interaction,{author:interaction.user.username,isdiscord:true},expired ? expiredtime : null)
    }

    switch(sub) {
      case "isbanned": return await discordCommands.admin.ban.isbanned(bm,gamertag,interaction)
      case "pardon": return await discordCommands.admin.ban.pardon(gamertag,bm,interaction)
    }
  }
  // Block系
  if (commandName === "block") {
    const type = interaction.options.getString("type")
    const player = interaction.options.getString("player")
    const minutes = interaction.options.getInteger("minutes")
    const block = interaction.options.getString("block")
    
    return await discordCommands.admin.block(interaction,type,player,block,minutes,logm)
  }
  // debug
  if (commandName == "debug") {
    const option = interaction.options.getString("option")
    // Info(デフォルト)
    if (!option || option === "Info") return await discordCommands.admin.debug.default(interaction,logm);
    if (option === "WalCheckPoint") return await discordCommands.admin.debug.walcheckpoint(logm,interaction);
    if (option === "Status") return await discordCommands.admin.debug.status(interaction,bds.isProcessAlive().alive,BSWVer,bds.BDSver,latestbackup.time,latestbackup.isfull)
    
  }
})




// Backup

const backup_path = path.join(root,"backup",servername,worldname)


const backup = new Backup(root,BDS_path,backup_path,worldname)

const latestbackup = {isfull:false,time:0}
backup.on("start",(isfull)=>{
  latestbackup.isfull = isfull
  latestbackup.time = Date.now()
  console.log(`Starting ${isfull ? "Full" : "Diff"} Backup...`)
  logm.Server(`${isfull ? "Full" : "Diff"} Backup Start`)
})

backup.on("stop",()=>{
    const log = `BackupSuccessful(${latestbackup.isfull ? "FULL" : "diff"})(${((Date.now() - latestbackup.time)/1000).toFixed(2)} Seconds)`;
    if (config.console.backupLogToConsole) console.log(chalk.bgBlue(log));
    logm.Server(log)
})

// Restore

backup.on("restoreStart",(date)=>{
  const datetext = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
  logm.Server(`Restore Start(Target:${datetext})`)
})

backup.on("restoreEnd",()=>{
  logm.Server(`Restore End`)
})

// 自動0時フルバックアップ

function scheduleNextMidnightFullBackup() {
  if (!config.backup.enabled) return
  function nextTime() {
    const next = new Date()
    next.setHours(0,0,0,0)
    next.setDate(next.getDate() + 1)
    return next - new Date()
  }
  setTimeout(async() => {
    try { 
      if (config.console.backupLogToConsole) console.log(chalk.bgMagenta("Starting daily FULL backup..."));
      const list = await backup.waitForPreparationsComplete(bds)
      await backup.backup(list,true, true,onlinePlayer,bds); // notskip=true, full=true
      await backup.removeOld()
    } catch(e){
      console.error(chalk.red(`[DAYLY-FULL-BACKUP-ERROR]${e}`))
    } finally {
      scheduleNextMidnightFullBackup()
    }
  }, nextTime());
}

scheduleNextMidnightFullBackup();






// addon

async function addon_copy() {
try {
    const addon_path = path.join(root,"default_server_addon")
    const dev_addon = path.join("bds","development_behavior_packs","default_server_addon")
    await fs.ensureDir(dev_addon)
    await fs.copy(addon_path,dev_addon)
    const manifest = JSON.parse(await fs.readFile(path.join(addon_path,"manifest.json")))
    const addon_uuid = manifest.header.uuid
    const worldpath = path.join(BDS_path,"worlds",worldname)
    await fs.ensureDir(worldpath)
    const bp_packlist_path = path.join(worldpath,"world_behavior_packs.json")
    await fs.ensureFile(bp_packlist_path)
    let bp_packlist_rawjson = await fs.readFile(bp_packlist_path)
    if (bp_packlist_rawjson == "") bp_packlist_rawjson = "[]"
    const bp_packlist = JSON.parse(bp_packlist_rawjson)
    let search_flag = false
    let search_index = NaN
    bp_packlist.forEach((element,index) => {
        if (element.pack_id == addon_uuid) {
            search_flag = true
            search_index = index
        }
    });
    if (search_flag) bp_packlist[search_index].version = manifest.header.version
    if (!search_flag) bp_packlist.push({"pack_id":addon_uuid,"version":manifest.header.version})
    await fs.writeFile(path.join(bp_packlist_path),JSON.stringify(bp_packlist,null,2))
    if (config.console.bswSystemLogToConsole) console.log(chalk.bgBlue("defaultAdd-on copy success"))
    logm.Server(`defaultAdd-on copy success`)
    
    WSbroadcast({"type":"server","datatype":"str","data":"defaultAdd-on copy success"})

}catch(e) {
  console.error(chalk.red(e.message))
}
};

// Addon Sync
addon_copy()

const bm = new BanManager(root);

// 起動する前にワールドチェック

const BetaApiEnable = {
  restart: false,
  enabled: false,
  run: async()=>{
    if (BetaApiEnable.enabled) return
    console.log(chalk.green("[EnableBetaAPI] - BetaApiがオンか確認中..."))
    const leveldat = path.join(BDS_path,"worlds",worldname,"level.dat")
    
    // ワールド生成前の場合、再起後に確認するように設定
    if (!await fs.exists(leveldat)) {
      console.log(chalk.green("[EnableBetaAPI] - ワールド生成前のため自動再起動と再実行を予定しました..."))
      BetaApiEnable.restart = true
      return
    }
    const originBuf = await fs.readFile(leveldat)

    // 確認
    const res = await betaApi.checkBetaApi(originBuf)
    if (res.isBetaApiEnabled) {
      BetaApiEnable.enabled = true
      BetaApiEnable.restart = false
      console.log(chalk.green("[EnableBetaAPI] - BetaAPIはオンになっています")) 
    } else {
      console.log(chalk.green("[EnableBetaAPI] - BetaAPIはオフになっています")) 
      const enableBuf = await betaApi.enableBetaApi(originBuf)
      console.log(chalk.green("[EnableBetaAPI] - BetaAPIを自動でオンします")) 
      await fs.cp(leveldat,path.join(path.dirname(leveldat),"level.dat.old"))
      await fs.rm(leveldat)
      await fs.writeFile(leveldat,enableBuf)
      BetaApiEnable.restart = false
    }
  }
}

// BDS Run
/**
 * @type {BDS}
 */
let bds = new BDS(BDS_path,BDS_file,logm,wss,false);



// スタート
(async()=>{
  await BetaApiEnable.run()
  bds.restart()
  // 初回Backup
  let startedBackup = false;

  const waitBackup = setInterval(() => {
    if (bds.server_started && !startedBackup) {
      startedBackup = true;
      clearInterval(waitBackup);
      // 定期バックアップ
      setInterval(async() => {
        const list = await backup.waitForPreparationsComplete(bds)
        await backup.backup(list,false,false,onlinePlayer,bds);
      }, 1000 * 60 * BackupInterval);
    }
  }, 500); // 0.5秒ごとにチェック
})();




// アドオンにPWを伝える

bds.on("started",()=>{
  if (BetaApiEnable.restart) {
    bds.exit()
    bds.restart()
    return
  }
  if (discordstarted) sendStartEmbed()
  if (config.Discord.enabled) client.login(config.Discord.TOKEN);
  bds.sendCommand(`send "${JSON.stringify({type:"syncConf","data":{pass:BDSsendPass,port:config.webUi.port}}).replaceAll("\"","'").replaceAll("\\","\\\\'")}"`)
  // Backup
  backup.waitForPreparationsComplete(bds).then((list)=>{
    backup.backup(list,false,true,onlinePlayer,bds)
  })
})
// BDS Spawn
bds.on("spawn",(json)=>{
  logm.PlayerJoin(json.name)
  WSbroadcast({"type":"PlayerJoin","data":json.name})
  onlinePlayer.join(json)
  LLtoDis(json.name,"join")
  if (bm.isbanned(json.name,true)) {
    const baninfo = bm.getinfo(json.name)
    const BanStart = new Date(baninfo.time)
    const BanStartText = formatDate(BanStart)
    const BanEnd = baninfo.expiredtime ? new Date(baninfo.expiredtime) : null
    const BanEndText = BanEnd ? msToYMDHMS(BanStart,BanEnd) : "無期限"
    const NowtoBanEndText = BanEnd ? msToYMDHMS(new Date(),BanEnd) : "無期限" 

    setTimeout(()=>{
      bds.sendCommand(`kick "${json.name}" "あなたは「§l${baninfo.reason}§r」により§l${BanStartText}§rから§l${BanEndText}§rの間BANされています。解除まで:§l${NowtoBanEndText}§r"`,true) 
    },1000*4)
    if (config.Discord.notifications.toAdmin.ban.enabled && channels.admin) channels.admin.send({content:`BAN者[${json.name}]を自動キックしました`})
  }
  if (config.console.joinPlayerLogToConsole) console.log(chalk.bgBlue(`PlayerJoin:${json.name}`))
})

// BDS Leave
bds.on("leave",(json)=>{
  WSbroadcast({"type":"PlayerLeave","data":json.name})

  onlinePlayer.leave(json.name)
  LLtoDis(json.name,"logout")
  if (!bm.isbanned(json.name) && config.backup.leavePlayerBackup) backup.waitForPreparationsComplete(bds).then((list)=>backup.backup(list,false,false,onlinePlayer,bds));
  if (config.console.leavePlayerLogToConsole) console.log(chalk.bgBlue(`PlayerLeave:${json.name}`))
})

// SKIPLIST

const LineSkipList = [
  /^[.* INFO] Saving\.\.\./,
  /^[.* INFO] Changes to the world are resumed\./
]

// BDS line
bds.on('line', (line) => {
// [BSW-ADDON-ALEART]
  if(/^\[.* INFO\] \[Scripting\] \[BSW-ADDON-ALEART\].*/.test(line)) return {skip:true}
  
  if (/^\[.* INFO\] \[Scripting\] \{"type":".*","cmd":".*","source":".*","data":".*","isEntity":.*\}/.test(line)) {
    const json = JSON.parse(line.match(/\{"type":".*","cmd":".*","source":".*","data":".*","isEntity":.*\}/)[0])


    if (json.type == "servercommand" && json.cmd == "reloadaddon") {
      const {source,isEntity} = json;
      (async()=>{
        await addon_copy()
        bds.sendCommand("reload")
        if (!isEntity) return {skip:true}
        bds.sendCommand(`tellraw ${source} {"rawtext":[{"text":"§cDefaultAddonCopy & AddonReload Success"}]}`)
      })()
    }

    if (json.type == "servercommand" && json.cmd == "backuplist") {
      const {source,isEntity} = json;
      (async()=>{
        const json = await backup.getlist(source)
        if (!isEntity) return {skip:true}
        bds.sendCommand(`send "${JSON.stringify(json).replaceAll("\"","'").replaceAll("\\","\\\\'")}"`,true)
      })()
    }

    if (json.type == "Logger" && json.cmd == "playerLeave") {
      const {source} = json;
      const dim = json.data
      const playername = source.replace(/\(.* .* .*\)/,"")
      const [x, y, z] = source.replace(playername,"").replace("(","").replace(")","").split(" ").map(Number)
      logm.PlayerLeave(playername,{x,y,z},dim)
      return {skip:true}
    }

    if (json.type == "Request" && json.cmd == "SyncConfRequest") {
      bds.sendCommand(`send "${JSON.stringify({type:"syncConf","data":{pass:BDSsendPass,port:config.webUi.port}}).replaceAll("\"","'").replaceAll("\\","\\\\'")}"`,true)
      return {skip:true}
    }
  }

  if (LineSkipList.some(v=>v.test(line))) return {skip:true}
});

let stop = false
// Ctrl+C

process.on('SIGINT', async() => {
  if (!bds.started) process.exit(0)
  console.log(chalk.green("stoping BDS..."))
  if (backup && backup.isbackuping) {
    console.log(chalk.green("Wait for backup ended..."))
    await backup.waitForBackupEnd()
  }
  stop = true
  bds.exit()
});

process.on('SIGTERM', async() => {
  if (!bds.started) process.exit(0)
  console.log(chalk.green("stoping BDS..."))
  if (backup && backup.isbackuping) {
    console.log(chalk.green("Wait for backup ended..."))
    await backup.waitForBackupEnd()
  }
  stop = true
  bds.exit()
});

// Exit
process.on("exit",()=>{
  stop = true
  bds.exit()
})

// エラーハンドリングしてない例外処理

function OnError(err) {
  console.error(chalk.red('UNHANDLED REJECTION:'), err);
  logm.Server(`ERROR - ${err.name} | ${err.message}`);
  (async()=>{
    try {
      if (config.Discord.enabled && channels.serverStatus &&config.Discord.notifications.serverStatus.enabled&&client.isReady()) {
        const serverErrEmbed = new discord.EmbedBuilder()
        .setTitle(`サーバーで例外エラーが発生しました${err.name}(${err.message})`)
        .setDescription(`[${servername}]${worldname}`)
        .setColor(0xf54242)
        .setTimestamp(new Date())
        await channels.serverStatus.send({embeds:[serverErrEmbed]})
      }
    }catch(e) {
        console.error(chalk.red("例外通知失敗:", e.message));
    }
  })();

 fs.ensureDirSync(path.join(root,"error"))
  const content = err.stack || JSON.stringify(err, null, 2)
 fs.writeFileSync(path.join(root,"error",`${Date.now()}-ERROR.err`),content)
}

process.on('unhandledRejection', err => {
  OnError(err)
});
process.on('uncaughtException',err => {
  OnError(err)
})


// BDS Close

bds.on('close', async(code) => {
  console.log(chalk.green(`BDS終了(${code})`));

  if (!stop && !BetaApiEnable.enabled && BetaApiEnable.restart) {
    BetaApiEnable.run().then(()=>bds.restart())
  }

  if (config.Discord.enabled && channels.serverStatus &&config.Discord.notifications.serverStatus.enabled&&client.isReady()) {
    const serverStopEmbed = new discord.EmbedBuilder()
    .setTitle("サーバーが停止しました。")
    .setDescription(`[${servername}]${worldname}`)
    .setColor(0xf54242)
    .setTimestamp(new Date())
    await channels.serverStatus.send({embeds:[serverStopEmbed]})
    
    if (stop) await client.destroy()
  }
  onlinePlayer.fullSync([])
  if (stop) process.exit(0);
});