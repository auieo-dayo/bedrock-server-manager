
class limit {
    constructor(windowMs=60000,maxReq=5) {
        this.requests = new Map();
        this.ms = windowMs
        this.maxreq = maxReq
    }
    limit(req,socket) {
        const ip = req.socket.remoteAddress;
        const now = Date.now();

        if (!this.requests.has(ip)) {
            this.requests.set(ip, []);
        }

        const timestamps = this.requests.get(ip).filter(t => now - t < this.ms);
        timestamps.push(now);
        this.requests.set(ip, timestamps);

        if (timestamps.length > this.maxreq) {
            socket.write("HTTP/1.1 429 Too Many this.requests\r\n\r\n");
            socket.destroy();
            return false;
        }
        return true;

    }
}

export default limit