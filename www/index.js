// https://github.com/auieo-dayo/bsm-dashboard-demo/ | simple | PC,スマホ用ダッシュボード
// MIT LICENSE

let bdsver = ""
// Backup


function sortBackupsDescending(list) {
  return list.sort((a, b) => {
    const dateA = new Date(a.date.yyyy, a.date.MM - 1, a.date.dd, a.date.hh, a.date.mm, a.date.ss);
    const dateB = new Date(b.date.yyyy, b.date.MM - 1, b.date.dd, b.date.hh, b.date.mm, b.date.ss);
    return dateB - dateA; // 新しい順（降順）
  });
}


async function backupset(data) {
  if (!data) return;
  const json = data
  const {allbackup,today} = json

  const todaybackuplist = sortBackupsDescending(json.todaybackuplist)

  document.getElementById("Backup_all").textContent = allbackup
  document.getElementById("Backup_today").textContent = today

  document.getElementById("backup_list").innerHTML=""

  todaybackuplist.forEach((value,index)=>{
      const {full,date} = value
      const div = document.createElement("div")
      if (full) div.classList.add("full")
      if (index == 0) div.classList.add("latest")

      const h1 = document.createElement("h1")
      h1.textContent = `${String(date.hh).padStart(2, '0')}:${String(date.mm).padStart(2, '0')}`
      

      const span = document.createElement("span")
      span.textContent = `:${String(date.ss).padStart(2, '0')}`
      h1.appendChild(span)
      
      const h2 = document.createElement("h2")
      h2.textContent = `${date.yyyy}/${date.MM}/${date.dd}`

      const p = document.createElement("p")
      if (full) p.textContent = "Full"
      if (index == 0) p.textContent = "Latest"

      if (full && index == 0) {
          p.textContent = "Full | Latest"
          div.classList.add("two")
      }

      
      
      div.appendChild(h1)
      div.appendChild(h2)
      div.appendChild(p)

      document.getElementById("backup_list").appendChild(div)

  })
  const date = new Date()
  document.getElementById("Backup_last").textContent = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`
}





let type = 0
function set(t=NaN) {
  switch(t) {
    case 0 :
      type = 0
      document.getElementById("backup_disp").style.display = "none"
      document.getElementById("console_disp").style.display = "none"
      document.getElementById("main_disp").style.display = "block"
      break;
    case 1 :
      type = 1
      document.getElementById("backup_disp").style.display = "none"
      document.getElementById("console_disp").style.display = "block"
      document.getElementById("main_disp").style.display = "none"  
      break;
    case 2 :
      type = 2
      document.getElementById("backup_disp").style.display = "block"
      document.getElementById("console_disp").style.display = "none"
      document.getElementById("main_disp").style.display = "none"  
      break;
    }

}

const modes = [
  "Light",
  "Dark"
]
let mode = 0

function ArrayNext(array=[],now=NaN) {
if (now >= array.length-1) {
  return 0
}
return now+1
}

function ChangeTheme(reload) {
  if (!reload) {
    mode = ArrayNext(modes,mode)
  }
  switch(modes[mode]) {
    case ("Dark"):
      document.body.style.background = "#3a3a5cff"
      document.body.style.color = "#a5a5a5ff"
      document.getElementById("LightDark").src = "./img/light.svg"
      break;
    case ("Light"):
      document.body.style.background = "#b1b1b1"
      document.body.style.color = "#000"
      document.getElementById("LightDark").src = "./img/dark.svg"
      break;
  }

  if (!reload) localStorage.setItem('theme', mode);

}

mode = localStorage.getItem('theme') ?? 0

ChangeTheme(true)



async function get(url) {
  try {
    const res = await fetch(url)
    return res
  } catch(e) {
    console.error(e.message)
  }
};
/**
 * @type {WebSocket}
 */
let socket
(async()=>{
if (location.search == "?debug") return
  // LogGet
  document.getElementById("log").innerHTML = ""
  const logres = await get(`${location.origin}/api/getlog`)
  const logjson = await logres.json()
  document.getElementById("log").innerHTML = ""
  for (const log of logjson) {
    const p = document.createElement("p")
    p.textContent = log.data
    p.dataset.time = log.time
    p.classList.add(log.type)
    document.getElementById("log").appendChild(p)
  }
  
  document.getElementById("log").scrollTo({"top":document.getElementById("log").scrollHeight})

  // WebSocket
const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
const token = await (await fetch(`${location.origin}/api/getwstoken`)).json()
socket = new WebSocket(`${protocol}://${location.hostname}:${location.port}/ws?token=${token.token}`);

//      socket = new WebSocket(`ws://${location.hostname}:${location.port}/ws`)
  socket.addEventListener("open", () => {
    console.log("接続");
  });

  // メッセージ受け取ったとき
  socket.addEventListener("message", (event) => {
    const json = JSON.parse(event.data)
    const p = document.createElement("p")
    p.textContent = json.data
    p.dataset.time = Date.now()
    p.classList.add(json.type)
    document.getElementById("log").appendChild(p)
    document.getElementById("log").scrollTo({"top":document.getElementById("log").scrollHeight})

  });

  // 接続閉じたとき
  socket.addEventListener("close", () => {
    console.log("切断された");
    alert("コンソールから切断されました")
  });

  // エラー発生したとき
  socket.addEventListener("error", (err) => {
    console.error("エラー:", err);
  });
})()

setInterval(async()=>{
  if (location.search == "?debug") return
  const res = await get(`${location.origin}/api/dashboard`)
  const json = await res.json()
  // Backup
  await backupset(json.backups)
  // Main
  const infojson = json.info
  document.getElementById("Sname").textContent = infojson.BDS.servername
  document.getElementById("Lname").textContent = infojson.BDS.levelname
  const par = infojson.BDS.player.now / infojson.BDS.player.max
  document.getElementById("Pint").textContent = `${infojson.BDS.player.now}/${infojson.BDS.player.max}(${par.toFixed(0)}%)`

  // System
  document.getElementById("MemFree").textContent = `${infojson.server.mem.free.toFixed(0)}GB`
  document.getElementById("MemTotal").textContent = `${infojson.server.mem.total.toFixed(0)}GB`
  document.getElementById("MemPar").textContent = `${(infojson.server.mem.par).toFixed(0)}%`
  document.getElementById("cpu").textContent = `${infojson.server.cpu.par.toFixed(0)}%`
  document.getElementById("cpupar").value = infojson.server.cpu.par.toFixed(0)
  document.getElementById("mempar").value = infojson.server.mem.par.toFixed(0)

  document.getElementById("nowBDSver").textContent = infojson.BDS.version
  document.getElementById("latestBDSver").textContent = bdsver

  if (bdsver && infojson.BDS.version != bdsver) {
    document.getElementById("alert").style.display = "block"
  }

  // Player
  const playerjson = json.onlines
  document.getElementById("players").innerHTML = ""
  for (const p of playerjson) {
    const li = document.createElement("li")
    li.textContent = p.name
    document.getElementById("players").appendChild(li)
  }
},1000*5)
document.getElementById("submit").addEventListener("click",()=>{
  const input = document.getElementById("inputcmd")
  if (!input.value) return
  if (!socket) return
  socket.send(JSON.stringify({"type":"cmd","data":input.value}))
  input.value = ""

});

(async()=>{
  if (location.search == "?debug") return
  const latest_res = await fetch("https://raw.githubusercontent.com/Bedrock-OSS/BDS-Versions/main/versions.json")
  const latest_json = await latest_res.json()
  const latest = latest_json.linux.stable
  bdsver = latest
})()




