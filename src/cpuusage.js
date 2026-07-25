import os from "os"
/**
 * CPU使用率を取得（%）
 * @param {number} interval 測定間隔（ミリ秒）
 * @returns {Promise<number>} CPU使用率（百分率）
 */
export async function getCpuUsage(interval = 1000) {
  function cpuTimes() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    for (const cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    return { user, nice, sys, idle, irq };
  }

  const start = cpuTimes();
  await new Promise(r => setTimeout(r, interval));
  const end = cpuTimes();

  const totalStart = start.user + start.nice + start.sys + start.idle + start.irq;
  const totalEnd = end.user + end.nice + end.sys + end.idle + end.irq;

  const idleDiff = end.idle - start.idle;
  const totalDiff = totalEnd - totalStart;

  const usage = (1 - idleDiff / totalDiff) * 100;
  return usage;
}
