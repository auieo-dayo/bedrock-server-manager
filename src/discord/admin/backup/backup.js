function b(isfull,backup,message,bds,playerstore) {
    backup.waitForPreparationsComplete(bds).then((list)=>{
        backup.backup(list,isfull,true,playerstore,bds).then(()=>{
            message.editReply(`${isfull ? "Full" : "Diff"} Backup Successfull!`)
        })
    })
}

export default b