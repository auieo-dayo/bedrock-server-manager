const nbt = require('prismarine-nbt')


/**
 * 
 * @param {Buffer | ArrayBuffer} rawNbt 
 */
async function enableBetaApi(rawNbt) {
    const n = await nbt.parse(rawNbt,"little");
    
    const header = n.metadata.buffer.subarray(0,8)
    
    if (!n.parsed.value.experiments) {
        n.parsed.value.experiments = { type: 'compound', value: {} };
    }
    const experiments = n.parsed.value.experiments.value;
    experiments.experiments_ever_used = { type: 'byte', value: 1 };
    experiments.gametest = { type: 'byte', value: 1 };
    experiments.saved_with_toggled_experiments = { type: 'byte', value: 1 };
    
    const nbtBuf = await nbt.writeUncompressed(n.parsed, "little"); 

    header.writeUInt32LE(nbtBuf.length, 4);

    const resBuf = Buffer.concat([header, nbtBuf]);
    return resBuf;
}
/**
 * 
  * @param {Buffer | ArrayBuffer} rawNbt  
 */
async function checkBetaApi(rawNbt) {
    const n = await nbt.parse(rawNbt)
    const {experiments_ever_used, saved_with_toggled_experiments, gametest} = n.parsed.value.experiments.value
    if (experiments_ever_used?.value === 1 &&
        saved_with_toggled_experiments?.value === 1 &&
        gametest?.value === 1
    ) {
        return {isBetaApiEnabled:true}
    } else return {isBetaApiEnabled:false}
}

module.exports = {enableBetaApi,checkBetaApi}