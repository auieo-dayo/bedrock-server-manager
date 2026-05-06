const fs = require('fs-extra');
const crypto = require("crypto")
const path = require("path")
const chalk = require("chalk");
const config = require('../config/config');


const pad = n => String(n).padStart(2, "0");

function hashFile(filePath) {
  const hash = crypto.createHash("sha1");
  const stream = fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on("data", d => hash.update(d));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}
function copyPartial(src, dest, bytes) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const readStream = fs.createReadStream(src, {
      start: 0,
      end: bytes - 1
    });
    const writeStream = fs.createWriteStream(dest);

    readStream.on("data", (chunk) => hash.update(chunk));
    readStream.on("error", reject);
    writeStream.on("error", reject);
    writeStream.on("finish", () => {
    resolve(hash.digest("hex"));
    });
    readStream.pipe(writeStream);
  });
}
async function getAllFiles(dir) {
    let results = [];
    const list = await fs.readdir(dir);

    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            results = results.concat(
                (await getAllFiles(fullPath)).map(f => path.join(file, f))
            );
        } else {
            results.push(file);
        }
    }
    return results;
}

async function walkDir(dir, relativePath = "") {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const result = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
            const sub = await walkDir(fullPath, relPath);
            result.push(...sub);
        } else {
            const stat = await fs.stat(fullPath);

            result.push({
                file: relPath,   // ←重要：相対パスで保存
                size: stat.size
            });
        }
    }

    return result;
}


class Backup {
    constructor(root,BDS_path,backup_path,worldname) {
        this.root = root
        this.bpath = backup_path
        this.BDS = BDS_path
        this.worldname = worldname

        this._events = {
            start: [],
            stop: [],
            restoreStart: [],
            restoreEnd: []
        }

        this.lastBackup = 0

        this.isbackuping = false
        this.isrestoring = false
    }
    
    waitForPreparationsComplete(bds) {
        if (!config.backup.enabled) return
        if (!bds) return
        bds.sendCommand("save hold",true)

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup()
                reject(new Error("[Backup - WaitForPreparationsComplete] Timeout Error"))
            }, 10000)
            const id = setInterval(()=>{
                bds.sendCommand("save query",true)
            },1000*2)

            let collecting = false
            const onLine = (_raw) => {
                const line = _raw.replace(/\u0000/g,"")
                if (/^\[.* INFO\] A previous save has not been completed./.test(line)) return {skip:true}
                if (/^\[.* INFO\] Data saved\. Files are now ready to be copied\./.test(line)) {
                    collecting=true
                    return {skip:true}
                };
                
                if (collecting && (!line.includes(":") || !line.includes(","))) return
                if (collecting) {
                    cleanup()
                    resolve(line)
                    return {skip:true}
                }
            }

            const cleanup = () => {
                clearTimeout(timeout)
                clearInterval(id)
                bds.off("line", onLine)
            }

            bds.on("line", onLine)
        })
    }
    async waitForBackupEnd() {
        while (this.isbackuping) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return
    }
    async backup(list,isfull=false,notskip=false,PlayerStore,bds) {
        if (this.isrestoring) return bds.sendCommand("save resume",true)
        if (!config.backup.enabled) return bds.sendCommand("save resume",true)
        if (!list && !isfull) return bds.sendCommand("save resume",true)
        const elapsed = Date.now() - this.lastBackup;
        const intervalMs = config.backup.interval * 60 * 1000;
        if (!notskip && (typeof PlayerStore.getAll()[0] == "undefined" && config.backup.pauseIfNoPlayer)) return bds.sendCommand("save resume",true);
        if (!notskip && elapsed < intervalMs) return bds.sendCommand("save resume",true)

        this.emit("start",isfull)
        this.isbackuping = true

        const files = list.split(", ").map(v => {
            const [file, size] = v.split(":");
            return { file: file.trim().replace(new RegExp(`^${this.worldname}/`),""), size: Number(size) };
        });
        const worldpath = path.join(this.BDS,"worlds",this.worldname)
        const ALWAYS_INCLUDE = [
            "world_behavior_packs.json",
            "world_resource_packs.json",
            "level.dat",
            "behavior_packs/",
            "resource_packs/"
        ]
        for (const p of ALWAYS_INCLUDE) {
            if (!await fs.pathExists(path.join(worldpath,p))) continue;
            const stat = await fs.stat(path.join(worldpath,p))
            if (stat.isDirectory()) {
                const fileInDir = await walkDir(worldpath,p)
                files.push(...fileInDir)
            } else {
                files.push({file:p,size:stat.size})
            }
        }

        const date = new Date()
        const fullpath = path.join(
            this.bpath,
            pad(date.getFullYear()),
            pad(date.getMonth() + 1),
            pad(date.getDate()),
            `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}${isfull ? `_FULL` : ""}`
        )


       

        
        const snapshotFile = path.join(this.bpath, "snapshot.json");
        
        
        let nowSnap = {}

        if (!isfull && await fs.pathExists(snapshotFile)) nowSnap = await fs.readJSON(snapshotFile);


        const entries = await Promise.all(files.map(async v => {
            const hash = await hashFile(path.join(worldpath, v.file))
            return [v.file, { hash, size: v.size }]
        }));

        const newSnap = Object.fromEntries(entries);

        await fs.ensureDir(fullpath)
        let copyCount = 0

        if (isfull) {
            for (const [rel,value] of Object.entries(newSnap)) {
                const dest = path.join(fullpath,rel)
                await fs.ensureDir(path.dirname(dest));
                await copyPartial(path.join(worldpath,rel),dest,value.size)
                copyCount++
            }
        } else {
            for (const [rel,value] of Object.entries(newSnap)) {
                if (nowSnap[rel]?.hash !== value.hash) {
                    const dest = path.join(fullpath, rel);
                    await fs.ensureDir(path.dirname(dest));
                    await copyPartial(path.join(worldpath,rel),dest,value.size)
                    copyCount++
                }
            }

        }
        await fs.writeJSON(snapshotFile,newSnap,{spaces:2})
        if (copyCount === 0) await fs.remove(fullpath);
        this.lastBackup = Date.now()
        this.emit("stop")
        this.isbackuping = false
        if (bds) bds.sendCommand("save resume",true);
        }
    async getlist(source, returnfullbackup = false) {
        const date = new Date();
        const yyyy_now = pad(date.getFullYear());
        const MM_now   = pad(date.getMonth() + 1);
        const dd_now   = pad(date.getDate());

        await fs.ensureDir(this.bpath);

        const all_list = [];
        const today_list = [];

        // helper: ディレクトリだけ返す（軽量版）
        const onlyDirs = async (target) => {
            try {
                const list = await fs.readdir(target, { withFileTypes: true });
                return list.filter(d => d.isDirectory()).map(d => d.name);
            } catch (e) {
                console.error(chalk.red(`[GetBackups] ${e.message}`));
                return [];
            }
        };

        for (const yyyy of await onlyDirs(this.bpath)) {
            for (const MM of await onlyDirs(path.join(this.bpath, yyyy))) {
                for (const dd of await onlyDirs(path.join(this.bpath, yyyy, MM))) {
                    for (const folder of await onlyDirs(path.join(this.bpath, yyyy, MM, dd))) {

                        const isFull = folder.endsWith("_FULL"); // より厳密に
                        const folderName = folder.replace("_FULL", "");
                        const [hh, mm, ss] = folderName.split("-");

                        if (!hh || !mm || !ss) continue;

                        const fullpath = path.join(yyyy, MM, dd, folder);

                        const item = {
                            fullpath: fullpath,
                            date: {
                                yyyy: Number(yyyy),
                                MM: Number(MM),
                                dd: Number(dd),
                                hh: Number(hh),
                                mm: Number(mm),
                                ss: Number(ss)
                            },
                            fullpathja:
                                `${yyyy}年${MM}月${dd}日 ${hh}時${mm}分${ss}秒` +
                                (isFull ? " (FULL)" : ""),
                            full: isFull
                        };

                        all_list.push(item);

                        if (yyyy === yyyy_now && MM === MM_now && dd === dd_now) {
                            today_list.push(item);
                        }
                    }
                }
            }
        }

        all_list.sort((a, b) => {
            return new Date(
                a.date.yyyy, a.date.MM - 1, a.date.dd,
                a.date.hh, a.date.mm, a.date.ss
            ) - new Date(
                b.date.yyyy, b.date.MM - 1, b.date.dd,
                b.date.hh, b.date.mm, b.date.ss
            );
        });

        today_list.sort((a, b) => {
            return new Date(
                a.date.yyyy, a.date.MM - 1, a.date.dd,
                a.date.hh, a.date.mm, a.date.ss
            ) - new Date(
                b.date.yyyy, b.date.MM - 1, b.date.dd,
                b.date.hh, b.date.mm, b.date.ss
            );
        });


        return {
            type: "backuplist",
            source: source,
            data: {
                allbackup: all_list.length,
                today: today_list.length,
                todaybackuplist: today_list,
                ...(returnfullbackup && { fullbackuplist: all_list })
            }
        };
    }

    async restore(target) {
        await this.waitForBackupEnd()
        if (this.isrestoring) return
        const backups = (await this.getlist("",true)).data

        const date = new Date(target)

        console.log(chalk.bgGreen("StartRestore from Backups..."))
        const datetext = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
        console.log(chalk.bgGreen(`Target:${datetext}`))
        this.emit("restoreStart",date)
        this.isrestoring = true

        // Fullからtargetまでのバックアップを取る
        const list = backups.fullbackuplist
        .filter(b => {
            const d = new Date(
            b.date.yyyy, b.date.MM - 1, b.date.dd,
            b.date.hh, b.date.mm, b.date.ss
            );
            return d <= date;
        })
        .sort((a, b) => {
            const da = new Date(a.date.yyyy, a.date.MM - 1, a.date.dd, a.date.hh, a.date.mm, a.date.ss);
            const db = new Date(b.date.yyyy, b.date.MM - 1, b.date.dd, b.date.hh, b.date.mm, b.date.ss);
            return da - db;
        });


        // 一番近いFULL
        const startIndex = list.map(v => v.full).lastIndexOf(true);


        if (startIndex === -1) {
            throw new Error("FULL backup not found");
        }

        const applyList = list.slice(startIndex);

        console.log(chalk.bgGreen(`Start:${applyList[0].fullpath} to End:${applyList[applyList.length-1].fullpathja}`))

        const restorePath = path.join(this.BDS, "worlds", this.worldname);

        // 一旦消す
        try {
            await fs.remove(restorePath);
        } catch (err) {
            console.error("[Restore -Error] ", err && err.stack ? err.stack : err);
        }

        await fs.ensureDir(restorePath);

        for (const backup of applyList) {
            const dir = path.join(this.bpath, backup.fullpath);
            const files = await getAllFiles(dir);

            for (const file of files) {
                const src = path.join(dir, file);
                const dest = path.join(restorePath, file);

                await fs.ensureDir(path.dirname(dest));
                await fs.copy(src, dest);
            }
        }
        console.log(chalk.bgGreen(`Completed Restore from Backups`))
        this.emit("restoreEnd",date)
        this.isrestoring = false
    }
    /**
     * 
     * @param {"start"|"stop"|"restoreStart"|"restoreEnd"} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (!this._events[event]) {
            this._events[event] = []
        }
        this._events[event].push(callback)
    }
    /**
     * 
     * @param {"start"|"stop"|"restoreStart"|"restoreEnd"} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!this._events[event]) return
        this._events[event] = this._events[event].filter(fn => fn !== callback)
    }
    /**
     * 
     * @param {"start"|"stop"|"restoreStart"|"restoreEnd"} event 
     * @param {...any} args 
     */
    emit(event, ...args) {
        if (!this._events[event]) return
        for (const fn of this._events[event]) {
            fn(...args)
        }
    }
}

module.exports = Backup