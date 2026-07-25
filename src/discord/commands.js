import pl from "./chat/pl.js";



import d from "./admin/d.js";
import p from "./admin/p.js";


import ban from "./admin/ban.js";

import backup from "./admin/backup.js";

import block from "./admin/block.js";

import debug from "./admin/debug.js";

export default {
    chat: { pl },
    admin: { p, d, ban, backup, block, debug }
}