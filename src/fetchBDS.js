import fs from "fs-extra"
import path from "path"
import chalk from "chalk"
import unziper from "unzipper"
import os from "os"


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
                    url: linux.href,
                    version: linux.pathname.match(/(?<=bedrock-server-).*(?=\.zip)/)[0]
                },
                Release: {
                    url: linuxPre.href,
                    version: linuxPre.pathname.match(/(?<=bedrock-server-).*(?=\.zip)/)[0]
                }
            },
            Windows: {
                Preview: {
                    url: win.href,
                    version: win.pathname.match(/(?<=bedrock-server-).*(?=\.zip)/)[0]
                },
                Release: {
                    url: winPre.href,
                    version: winPre.pathname.match(/(?<=bedrock-server-).*(?=\.zip)/)[0]
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
     */
    async fetchBDS(isPreview=false,OS) {
        if (!["Windows","Linux"].includes(OS)) return;
        const versionList = await this.getLatestVersion()
        const version = versionList[OS][isPreview?"Preview":"Release"];
        
        // BDSの取得
        console.log(chalk.green(`[FetchBDS] - Fetching BDS(${version.version} ${isPreview?"Preview":""})`))
        let res = await fetch(version.url);
        let buf = await res.arrayBuffer()

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
        buf = null;
        res = null;
        directory = null
        // 逃したファイルをもとに戻す
        for (const file of notUpdateSavedFileList) {
            await fs.ensureDir(path.dirname(file.src))
            await fs.copyFile(file.dest,file.src)
            await fs.remove(file.dest)
        }
        console.log(chalk.green(`[FetchBDS] - Complated Download and Extracted BDS`))

    }
};

export default fetchBDS