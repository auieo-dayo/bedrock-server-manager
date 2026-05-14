const pl = require("./chat/pl");



const d = require("./admin/d");
const p = require("./admin/p");

const ban = require("./admin/ban")

const backup = require("./admin/backup")

const block = require("./admin/block")

const debug = require("./admin/debug")

module.exports = {
    chat: { pl },
    admin: { p, d, ban, backup, block, debug }
}