import fs from "fs-extra"
import path from "path"
import chalk from "chalk"
import unziper from "unzipper"
import os from "os"
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB", "PB"];

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${units[i]}`;
}


const urlListURL = "https://net-secondary.web.minecraft-services.net/api/v1.0/download/links"

const notUpdateFileList = [
    "allowlist.json",
    "permissions.json"
]

class fetchBDS {
    constructor(root,BDS_path) {
        this.root = root
        this.folder = path.join(root,"temp","FetchBDS")
        this.BDS_path = BDS_path
        this.updating = false
    }
    /**
     * BDSの最新バージョンをAPIから取得する
     */
    async getLatestVersion() {
        const res = await fetch(urlListURL)
        /**
         * @type {{result:{links:{downloadType:string,downloadUrl:string}[]}}}
         */
        const json = await res.json()
        const win = new URL(json.result.links.find((v)=>(v.downloadType === "serverBedrockWindows")).downloadUrl);
        const winPre = new URL(json.result.links.find((v)=>(v.downloadType === "serverBedrockPreviewWindows")).downloadUrl);

        const linux = new URL(json.result.links.find((v)=>(v.downloadType === "serverBedrockLinux")).downloadUrl);
        const linuxPre = new URL(json.result.links.find((v)=>(v.downloadType === "serverBedrockPreviewLinux")).downloadUrl);

        const version = {
            Linux: {
                Preview: {
                    url: linuxPre.href,
                    version: linuxPre.pathname.match(/(?<=bedrock-server-).*(?=\.zip)/)[0]
                },
                Release: {
                    url: linux.href,
                    version: linux.pathname.match(/(?<=bedrock-server-).*(?=\.zip)/)[0]
                }
            },
            Windows: {
                Preview: {
                    url: winPre.href,
                    version: winPre.pathname.match(/(?<=bedrock-server-).*(?=\.zip)/)[0]
                },
                Release: {
                    url: win.href,
                    version: win.pathname.match(/(?<=bedrock-server-).*(?=\.zip)/)[0]
                }
            },
            Java: json.result.links.find((v)=>(v.downloadType === "serverJar")).downloadUrl
        }
        return version
    }

    /**
     * BDSを取得する
     * @param {boolean} isPreview 
     * @param {"Windows"|"Linux"} OS
     * @param {Promise<ReturnType<typeof this.getLatestVersion>>} versionList 
     */
    async fetchBDS(isPreview=false,OS,versionList) {
        try {
            if (this.updating) return
            if (!["Windows","Linux"].includes(OS)) return;
            const version = versionList[OS][isPreview?"Preview":"Release"];
            this.updating = true
            // BDSの取得
            console.log(chalk.green(`[FetchBDS] - Fetching BDS(${version.version} ${isPreview?"Preview":""})`))
            let res = await fetch(version.url);

            // チャンク溜め
            let chunks = []

            // 進捗表示
            const starttime = Date.now()
            let total = Number(res.headers.get("content-length"))
            let downloaded = 0
            for await (const chunk of res.body) {
                chunks.push(chunk)
                downloaded += chunk.length
                let text = ""
                // total取れてないときはパーセンテージを計算しない
                if (!Number.isNaN(total) && total !== 0) {
                    text=`${((downloaded / total) * 100).toFixed(1)}% | `
                }
                // 経過時間
                const elapsed = Math.max((Date.now() - starttime) / 1000, 0.001);
                // DLスピード(Byte/s)
                const speed = downloaded / elapsed;
                text+=`${formatBytes(downloaded,0)}/${formatBytes(total,0)} | ${formatBytes(speed,0)}/s`
                // total取れてないときはETAも計算しない
                if (!Number.isNaN(total) && total !== 0) {
                    const remain = (total - downloaded) / speed;
                    text += ` | ETA ${remain.toFixed(1)}s`;
                }
                process.stdout.write("\r\x1b[K" + chalk.green(`[FetchBDS] Downloading... ${text}`))
            }
            process.stdout.write("\n");

            let buf = Buffer.concat(chunks)

            const notUpdateSavedFileList = []
            // 一度復旧がめんどいファイル逃がす
            for (const file of notUpdateFileList) {
                const p = path.join(this.BDS_path,file)
                if (!await fs.pathExists(p)) continue;
                const dest =  path.join(this.root,"temp","FetchBDS",file)
                await fs.ensureDir(path.dirname(dest))
                await fs.copyFile(p,dest)
                notUpdateSavedFileList.push({src:p,dest})
            }

            // zip解凍
            console.log(chalk.green(`[FetchBDS] - Extracting BDS`))
            await fs.ensureDir(this.BDS_path)
            let directory = await unziper.Open.buffer(Buffer.from(buf))

            for (const file of directory.files) {
                const out = path.join(this.BDS_path, file.path);

                if (file.type === "Directory") {
                    await fs.ensureDir(out,{ recursive: true });
                    continue;
                }

                await fs.ensureDir(path.dirname(out), { recursive: true });
                


                await new Promise((resolve, reject) => {
                    file.stream()
                        .pipe(fs.createWriteStream(out))
                        .on("finish", resolve)
                        .on("error", reject);
                });
            }
            // LinuxだけBDSに実行権限つける
            if (os.platform() === "linux" && OS === "Linux") {
                fs.chmod(path.join(this.BDS_path,"bedrock_server"),0o755)
            }
            // ここで一応メモリ開放
            directory = null
            buf = null;
            res = null;
            // 逃したファイルをもとに戻す
            for (const file of notUpdateSavedFileList) {
                await fs.ensureDir(path.dirname(file.src))
                await fs.copyFile(file.dest,file.src)
                await fs.remove(file.dest)
            }
            console.log(chalk.green(`[FetchBDS] - Completed Download and Extracted BDS`))
            this.updating = false
        } catch(e) {
            this.updating = false
            throw e
        }
    }
    /**
     * 対応してるOSしか取得できません
     * @returns {string | null}
     */
    getRunningOS() {
        const r = {win32:"Windows",linux:"Linux"}[os.platform()]
        return r?r:null
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
};

export default fetchBDS