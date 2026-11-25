import {db} from './db.js';
import {TABLES,makeBackup,forRestore} from './backup.mjs';
import {isOpen} from './teaching.mjs';
const stores=()=>TABLES.map(k=>db.table(k));
export async function readWorkspace(){return db.transaction('r',stores(),async()=>Object.fromEntries(await Promise.all(TABLES.map(async k=>[k,await db.table(k).toArray()]))))}
export async function exportWorkspace(prefs){return makeBackup(await readWorkspace(),prefs)}
export async function replaceWorkspace(raw){const backup=forRestore(raw);return db.transaction('rw',stores(),async()=>{if((await db.teachingSessions.toArray()).some(isOpen))throw Error('SESSION_OPEN');for(const key of [...TABLES].reverse())await db.table(key).clear();for(const key of TABLES)if(backup.data[key].length)await db.table(key).bulkAdd(backup.data[key]);return backup})}
export async function resetWorkspace(){return db.transaction('rw',stores(),async()=>{if((await db.teachingSessions.toArray()).some(isOpen))throw Error('SESSION_OPEN');for(const key of [...TABLES].reverse())await db.table(key).clear()})}
export async function deleteFinishedHistory(){return db.transaction('rw',db.teachingSessions,async()=>{if((await db.teachingSessions.toArray()).some(isOpen))throw Error('SESSION_OPEN');await db.teachingSessions.clear()})}
