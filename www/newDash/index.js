const BASEURL = location.origin

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

async function get(path) {
    const res = await fetch(`${BASEURL}${path}`);

    return await res.json();
}
function sortBackupsDescending(list) {
  return list.sort((a, b) => {
    const dateA = new Date(a.date.yyyy, a.date.MM - 1, a.date.dd, a.date.hh, a.date.mm, a.date.ss);
    const dateB = new Date(b.date.yyyy, b.date.MM - 1, b.date.dd, b.date.hh, b.date.mm, b.date.ss);
    return dateB - dateA; // 新しい順（降順）
  });
}
async function setbackup(data) {
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
  // const date = new Date()
  // document.getElementById("Backup_last").textContent = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`
}

function setmove(box) {
    let dragging = false;
    let offsetX, offsetY;

    // 上下左右の余白(px)
    const limits = {
        top: 38,    // 上から35px
        left: 5,    // 左から5px
        right: 5,   // 右から5px
        bottom: 5   // 下から5px
    };

    function calcBounds() {
        return {
            xMin: limits.left,
            yMin: limits.top,
            xMax: window.innerWidth - limits.right - box.offsetWidth,
            yMax: window.innerHeight - limits.bottom - box.offsetHeight
        };
    }

    let bounds = calcBounds();

    // ウィンドウリサイズ時も再計算
    window.addEventListener('resize', () => {
        bounds = calcBounds();
    });

    box.addEventListener('mousedown', e => {
        dragging = true;
        offsetX = e.clientX - box.offsetLeft;
        offsetY = e.clientY - box.offsetTop;
        box.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        // 範囲制限
        newX = Math.max(bounds.xMin, Math.min(bounds.xMax, newX));
        newY = Math.max(bounds.yMin, Math.min(bounds.yMax, newY));

        box.style.left = newX + 'px';
        box.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', () => {
        dragging = false;
        box.style.cursor = 'grab';
    });
}

function setinfo(json) {
    document.getElementById("info-server").textContent = json.BDS.servername
    document.getElementById("info-BDS-ver").textContent = json.BDS.version
    document.getElementById("info-BSW-ver").textContent = json.server.BSWVer

    document.getElementById("info-pl-online").textContent = json.BDS.player.now
    document.getElementById("info-pl-max").textContent = json.BDS.player.max
    document.getElementById("info-cpu-using").textContent = Math.floor(json.server.cpu.par)
    document.getElementById("info-mem-free").textContent = Math.floor(json.server.mem.free)
    document.getElementById("info-mem-using").textContent = Math.floor(json.server.mem.par)

    
    document.getElementById("cpubar").querySelector(".fill").style.width = `${Math.floor(json.server.cpu.par)}%`
    document.getElementById("cpubar").querySelector(".fill").querySelector("span").textContent = `${Math.floor(json.server.cpu.par)}`


    document.getElementById("membar").querySelector(".fill").style.width = `${Math.floor(json.server.mem.par)}%`
    document.getElementById("membar").querySelector(".fill").querySelector("span").textContent = `${Math.floor(json.server.mem.par)}`


}

function addlog(json) {
    if (json.type == "chat") addChat(json)
    const p = document.createElement("p")
    p.textContent = json.data
    p.classList.add(json.type)
    const logs = document.getElementById("logs")
    logs.appendChild(p)
    logs.scroll({behavior:"smooth",top:logs.scrollHeight})
}

function addChat(json) {
    const div = document.getElementById("ChatWindow").querySelector(".list")
    const p = document.createElement("p")
    p.textContent = json.data
    div.appendChild(p)
}


document.addEventListener("DOMContentLoaded",async ()=>{
    // ISphone
    if (isMobile()) location.href = location.origin
    // Change
    const Elements = {
        info: document.getElementById("info"),
        console: document.getElementById("console"),
        backup: document.getElementById("backups")
    }
    let active = "info"
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
    }
    document.getElementById("nav-btn-info").addEventListener("click",()=>show("info"))
    document.getElementById("nav-btn-console").addEventListener("click",()=>show("console"))
    document.getElementById("nav-btn-backup").addEventListener("click",()=>show("backup"))

    // Time
    const time = document.getElementById("time")
    const date =new Date()
    time.textContent = `${String(date.getHours()).padStart(0,2)}:${String(date.getMinutes()).padStart(0,2)}`
    setTimeout(()=>{
        setInterval(()=>{
            const date =new Date()
            time.textContent = `${String(date.getHours()).padStart(0,2)}:${String(date.getMinutes()).padStart(0,2)}`
        },1000*60)
    },60000 - (Date.now() % 60000))

    // PlayerList

    setmove(document.getElementById("playerList"))
    setmove(document.getElementById("SystemBar"))
    setmove(document.getElementById("ChatWindow"))



    const logs =await get("/api/getlog")
    logs.forEach((v)=>addlog(v))
    
    const playerList = document.getElementById("playerList").querySelector("ul")

    async function ref() {
        const json = await get("/api/dashboard")
        setinfo(json.info)
        setbackup(json.backups)
        playerList.innerHTML=""
        json.onlines.forEach((v)=>{
            const li = document.createElement("li")
            li.textContent = v.name
            playerList.appendChild(li)
        })
    }
    ref()
    setInterval(async()=>{await ref()},1000*5)
    //Socket
    const token = (await get("/api/getwstoken")).token
    const socket = new WebSocket(`${BASEURL}/ws?token=${token}`)
    
    // Dummy
    // let socket= {addEventListener:()=>{}}

    socket.addEventListener("open",()=>addlog({type:"system",data:"WebSocket Opend"}))
    socket.addEventListener("close",()=>{
        addlog({type:"system",data:"WebSocket Opend"})
        alert("WebSocket Closed")
    })
    socket.addEventListener("message",(ev)=>addlog(JSON.parse(ev.data)))
    //   logs
    document.getElementById("input").addEventListener("keydown", e => {if (e.key === "Enter") document.getElementById("submit").click();});
    document.getElementById("submit").addEventListener("click",()=>{
        const input = document.getElementById("input")
        if (!input.value) return
        socket.send(JSON.stringify({type:"cmd",data:input.value}))
        input.value = ""
    })

})

