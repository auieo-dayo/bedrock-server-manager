/**
 * @type {WebSocket | null}
 */
let socket=null
function sendCmd(cmd) {
    if (socket.readyState !== socket.OPEN) return
    socket.send(JSON.stringify({type:"cmd",data:String(cmd)}))
}
function addlog(json) {
    const log = document.getElementById("console-log")
    const p = document.createElement("p")
    p.textContent = json.data
    p.classList.add(json.type)
    log.appendChild(p)
    log.scroll({behavior:"smooth",top:log.scrollHeight})
}

document.addEventListener("DOMContentLoaded",()=>{
    // 表示処理
    const Elements = {
        info: document.getElementById("info"),
        console: document.getElementById("console"),
        player: document.getElementById("player")
    }
    let active = "info"
    let firstConsole = false
    function show(type) {

        if (active === type) return
        Elements[type].style.display = "block"
        Elements[active].classList.remove("open")
        Elements[active].classList.add("close")
        const _active = active
        setTimeout(() => {
            Elements[type].classList.remove("close")
            Elements[type].classList.add("open")
            Elements[_active].style.display = "none"
        }, 100);
        active = type
        if (!firstConsole) {
            document.getElementById("console-log").scroll({behavior:"smooth",top:document.getElementById("console-log").scrollHeight})
            firstConsole = true
        }
    }
    // ボタンたち
    document.getElementById("btn-info").addEventListener("click",()=>show("info"))
    document.getElementById("btn-console").addEventListener("click",()=>show("console"))
    document.getElementById("btn-player").addEventListener("click",()=>show("player"))

    // CONSOLE
    document.getElementById("submit").addEventListener("click",()=>{
        const cmd = document.getElementById("cmd")
        sendCmd(cmd.value)
        cmd.value = ""
    })
    document.getElementById("cmd").addEventListener("keypress",(ev)=>{
        const key = ev.key
        if (key !== "Enter") return
        const tar = ev.currentTarget
        sendCmd(tar.value)
        tar.value = ""
    })

    // INIT CONSOLE
    initConsole()
    setInterval(async ()=>{await refresh()},1000*15)
})

async function initConsole() {
    if (location.search == "?debug") return
    
    const res = await fetch(`${location.origin}/api/getlog`)
    const json = await res.json()

    for (const v of json) {
        addlog(v)
    }
    

    
    const TokenRes = await fetch(`${location.origin}/api/getwstoken`)
    const Tokenjson = await TokenRes.json()
    const token = Tokenjson.token

    socket = new WebSocket(`${location.origin}/ws?token=${token}`)

    socket.addEventListener("open",()=>{
        addlog({type:"WEB",data:"WebSocketスタート"})
    })
    socket.addEventListener("close",()=>{
        addlog({type:"WEB",data:"WebSocketストップ"})
    })
    socket.addEventListener("message",(ev)=>{
        const json = JSON.parse(ev.data)
        addlog(json)
    })
}

async function refresh() {
    if (location.search == "?debug") return
    const res = await fetch(`${location.origin}/api/dashboard`)
    const json = await res.json()
    document.getElementById("ServerName").textContent = json.info.BDS.servername
    document.getElementById("Player").textContent = `${json.info.BDS.player.now}/${json.info.BDS.player.max}`
    document.getElementById("Version").textContent = json.info.BDS.version
    document.getElementById("BSWVersion").textContent = json.info.server.BSWVer
    document.getElementById("all-backup").textContent = json.backups.allbackup
    document.getElementById("today-backup").textContent = json.backups.today
    document.getElementById("mem").querySelector(".fill").style.width = `${Number(json.info.server.mem.par).toFixed(0)}%`
    document.getElementById("cpu").querySelector(".fill").style.width = `${Number(json.info.server.cpu.par).toFixed(0)}%`

    // Player
    const playerlist = document.getElementById("players")
    playerlist.innerHTML = ""
    for(const p of json.onlines) {
        const name = p.name
        const li = document.createElement("li")
        li.textContent = name
        playerlist.appendChild(li)
    }
    if (typeof json.onlines[0] == "undefined") {
        const li = document.createElement("li")
        li.textContent = "<NonPlayer>"
        playerlist.appendChild(li)
    }
}