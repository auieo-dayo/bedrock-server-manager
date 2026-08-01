import path from "path"
import fetchbds from "../src/fetchBDS.js";
import config from "../config/config.js"
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const root = path.join(import.meta.dirname,"..")
const updater = new fetchbds(root,path.join(root,"bds"))



const updateVersionList = await updater.getLatestVersion()
const runningOS = updater.getRunningOS()
if (!runningOS) {
    console.error("非対応OSです")
    process.exit(1)
}
const updateto = updateVersionList[runningOS][config.update.Minecraft.isPreview ? "Preview": "Release"]


const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

const answer = (await rl.question(`Update to ${updateto.version}？ (y/n): `))
  .trim()
  .toLowerCase();

rl.close();

if (!["y","n"].includes(answer)) {
    console.error("有効な入力をしてください")
    process.exit(1)
}
if (answer === "n") process.exit(0);

await updater.fetchBDS(config.update.Minecraft.isPreview,runningOS,updateVersionList)