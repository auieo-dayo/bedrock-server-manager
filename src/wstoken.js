import { v4 } from "uuid"

class wstoken {
    constructor(tokentimeout=60000) {
        this.timeout = tokentimeout
        this.tokens = new Map()
    }
    gettoken() {
        const token = v4()

        const id = setTimeout(()=>{
            this.tokens.delete(token)
        },this.timeout)

        this.tokens.set(token,id)
        
        return token
    }

    use(token) {
        if (!this.tokens.has(token)) return {passed:false,token}
        const id = this.tokens.get(token)
        clearTimeout(id)
        this.tokens.delete(token)
        return {passed:true,token}
    }
}

export default wstoken;