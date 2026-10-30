/**
 * 
 * @param {string} sup 
 */
export default function serverUdpPorts(sup="") {
    const result = {IP:null,localport:{start:null,end:null},publictport:{start:null,end:null},iserr:false}

    // IP
    const ipregx = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/
    const ip = sup.match(ipregx)
    if (ip) result.IP = ip[0];
    
    // Port
    const ports = sup.match(/\b(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)\b-\b(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)\b/g)
    

    if (ports) {
        const pub = String(ports[0]).split("-")
        result.publictport.start = pub[0]
        result.publictport.end = pub[1]
    } else if (/^(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}|0)\b$/.test(sup)) {
        result.publictport.start = sup
        result.publictport.end = sup
    } else{
        result.iserr = true
        return result
    }
    

    if (ports) {
        const loc = String(ports[1]).split("-")
        if (typeof loc[0] !== "undefined" && typeof loc[1] !== "undefined") {
            result.localport.start = loc[0]
            result.localport.end = loc[1]
        } else {
            result.localport.start = result.publictport.start
            result.localport.end = result.publictport.end
        }
    } else {
        result.localport.start = result.publictport.start
        result.localport.end = result.publictport.end
    }



    return result
    
}