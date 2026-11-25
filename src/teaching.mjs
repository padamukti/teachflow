import {validateWordwall} from '../shared/wordwall.mjs';
import {planIssues} from './learning.mjs';
const text=(v,max=5000)=>String(v??'').trim().slice(0,max);
export const isOpen=s=>['running','paused'].includes(s?.status);
export function elapsed(s,now=Date.now()){return Math.max(0,s.elapsedMs||0)+(s.status==='running'?Math.max(0,now-s.runningSince):0)}
export function formatDuration(ms){const n=Math.floor(Math.max(0,ms)/1000);return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0')).join(':')}
export function makeSession(plan,activities,students,includeBackup,now=Date.now(),id=crypto.randomUUID()){
 const issues=planIssues(plan,activities,students);if(plan.status!=='ready'||issues.unavailable||issues.studentUnavailable)throw Error('PLAN_UNAVAILABLE');
 const items=plan.items.filter(x=>includeBackup||!x.isBackup).flatMap(x=>{const a=activities.find(a=>a.id===x.activityId&&!a.archivedAt);if(!a)return [];return [{activityId:a.id,title:a.title,embedUrl:validateWordwall(a.embedUrl,'embed').url,originalUrl:a.originalUrl||'',authorName:a.authorName||'',instructions:x.instructions||'',stage:x.stage||'',duration:x.duration??null,isBackup:!!x.isBackup,status:'pending',openedAt:null,elapsedMs:0,evaluation:null}]});
 if(!items.some(x=>!x.isBackup))throw Error('PLAN_UNAVAILABLE');
 items[0].openedAt=new Date(now).toISOString();return {id,planId:plan.id,planTitle:plan.title,studentId:plan.studentId||null,studentName:students.find(x=>x.id===plan.studentId)?.name||'',items,currentIndex:0,status:'running',startedAt:new Date(now).toISOString(),endedAt:null,runningSince:now,itemSince:now,elapsedMs:0,revision:0,notes:''};
}
export function normalizeEvaluation(v){const rating=v.rating===''||v.rating==null?null:Number(v.rating);if(rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))throw Error('RATING_INVALID');return {rating,fit:['fitGood','fitPartial','fitPoor'].includes(v.fit)?v.fit:'',response:text(v.response),issues:text(v.issues),recommendation:text(v.recommendation)}}
export function itemElapsed(s,index,now=Date.now()){return Math.max(0,s.items[index]?.elapsedMs||0)+(s.status==='running'&&index===s.currentIndex?Math.max(0,now-(s.itemSince??s.runningSince)):0)}
export function transition(s,action,now=Date.now()){
 const next={...s,items:s.items.map(x=>({...x})),revision:(s.revision||0)+1};
 const index=action.index??s.currentIndex;const item=next.items[index];
 if(action.type==='evaluate'||action.type==='notes'){
  if(isOpen(s))throw Error('FINISH_FIRST');if(action.type==='notes')next.notes=text(action.notes);else{if(!item||!item.openedAt)throw Error('ITEM_INVALID');item.evaluation=normalizeEvaluation(action.value)}return next;
 }
 if(!isOpen(s))throw Error('SESSION_CLOSED');
 if(s.status==='running'&&['pause','finish','go'].includes(action.type)){next.items[s.currentIndex].elapsedMs=itemElapsed(s,s.currentIndex,now);next.itemSince=null}
 if(action.type==='pause'&&s.status==='running'){next.elapsedMs=elapsed(s,now);next.runningSince=null;next.status='paused'}
 else if(action.type==='resume'&&s.status==='paused'){next.runningSince=now;next.itemSince=now;next.status='running'}
 else if(action.type==='finish'){next.elapsedMs=elapsed(s,now);next.runningSince=null;next.endedAt=new Date(now).toISOString();next.status=next.items.filter(x=>!x.isBackup).every(x=>x.status==='completed')?'completed':'endedEarly'}
 else if(['go','complete','skip'].includes(action.type)&&s.status==='running'){
  if(!Number.isInteger(index)||!item)throw Error('ITEM_INVALID');if(action.type==='go'){next.currentIndex=index;next.itemSince=now;item.openedAt ||= new Date(now).toISOString()}else{item.status=action.type==='complete'?'completed':'skipped';item.openedAt ||=new Date(now).toISOString()}
 }else throw Error('SESSION_ACTION');return next;
}
export function sessionProgress(s){return {completed:s.items.filter(x=>x.status==='completed').length,skipped:s.items.filter(x=>x.status==='skipped').length,total:s.items.length}}
export function filterSessions(rows,{student='',status='',date='',query=''}={}){const q=query.trim().toLocaleLowerCase();return rows.filter(s=>(!student||s.studentId===student)&&(!status||s.status===status)&&(!date||localDate(s.startedAt)===date)&&(!q||[s.planTitle,s.studentName,...s.items.map(x=>x.title)].join(' ').toLocaleLowerCase().includes(q))).sort((a,b)=>b.startedAt.localeCompare(a.startedAt))}
function localDate(v){const d=new Date(v);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function activityStats(sessions,id){const entries=sessions.filter(s=>!isOpen(s)).flatMap(s=>s.items.filter(x=>x.activityId===id&&x.openedAt).map(x=>({item:x,date:x.openedAt})));const ratings=entries.map(x=>x.item.evaluation?.rating).filter(x=>Number.isInteger(x));return {count:entries.length,rating:ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:null,ratingCount:ratings.length,last:entries.map(x=>x.date).sort().at(-1)||null}}
