import Dexie from 'dexie';
import {normalizeMetadata} from './model.mjs';
export const db = new Dexie('TeachFlow');
// Same origin, database name and v1 primary key as Stage 01. New fields are non-indexed.
db.version(1).stores({activities:'id,resourceId,embedUrl,createdAt,updatedAt'});
export const listActivities=()=>db.activities.orderBy('createdAt').reverse().toArray();
export async function saveActivity(data){
  return db.transaction('rw',db.activities,async()=>{
    const all=await db.activities.toArray();
    if(all.some(a=>(data.resourceId&&a.resourceId===data.resourceId)||a.embedUrl===data.embedUrl)) throw new Error('DUPLICATE');
    const now=new Date().toISOString();
    const record={...data,...normalizeMetadata(data),id:crypto.randomUUID(),createdAt:now,updatedAt:now,favorite:false,archivedAt:null};
    await db.activities.add(record); return record;
  });
}
export async function updateActivity(id,metadata){
  if(!await db.activities.update(id,{...normalizeMetadata(metadata),updatedAt:new Date().toISOString()}))throw new Error('NOT_FOUND');
}
export async function patchActivity(id,patch){
  if(!await db.activities.update(id,{...patch,updatedAt:new Date().toISOString()}))throw new Error('NOT_FOUND');
}

// Version 2 adds stores only: existing v1 activity records and indexes remain intact.
db.version(2).stores({activities:'id,resourceId,embedUrl,createdAt,updatedAt',collections:'id,name,updatedAt',students:'id,name,archivedAt,updatedAt',lessonPlans:'id,studentId,scheduledDate,status,updatedAt'});
import {normalizeCollection,normalizeStudent,normalizePlan,activityReferenced,planIssues} from './learning.mjs';
export async function listLearning(){return db.transaction('r',db.collections,db.students,db.lessonPlans,async()=>({collections:await db.collections.toArray(),students:await db.students.toArray(),plans:await db.lessonPlans.toArray()}))}
export async function saveLearning(kind,draft){const map={collections:[db.collections,normalizeCollection],students:[db.students,normalizeStudent],plans:[db.lessonPlans,normalizePlan]};const [table,normalize]=map[kind];return db.transaction('rw',db.activities,db.collections,db.students,db.lessonPlans,async()=>{const data=normalize(draft),old=draft.id?await table.get(draft.id):null;if(draft.id&&!old)throw Error('NOT_FOUND');const refs=kind==='plans'?data.items.map(x=>x.activityId):data.activityIds;const activities=await db.activities.bulkGet(refs);if(activities.some(a=>!a))throw Error('REFERENCE_MISSING');if(kind==='students'&&(await db.collections.bulkGet(data.collectionIds)).some(c=>!c))throw Error('REFERENCE_MISSING');if(kind==='plans'){const student=data.studentId?await db.students.get(data.studentId):null;if(data.studentId&&!student)throw Error('REFERENCE_MISSING');if(data.status==='ready'){const issue=planIssues(data,activities,student?[student]:[]);if(issue.unavailable||issue.studentUnavailable)throw Error('PLAN_UNAVAILABLE')}}const now=new Date().toISOString();const record={...old,...data,id:old?.id||crypto.randomUUID(),createdAt:old?.createdAt||now,updatedAt:now};await table.put(record);return record})}
export async function deleteLearning(kind,id){return db.transaction('rw',db.collections,db.students,db.lessonPlans,async()=>{if(kind==='collections'){for(const s of await db.students.toArray()){if(s.collectionIds.includes(id))await db.students.update(s.id,{collectionIds:s.collectionIds.filter(x=>x!==id)})}await db.collections.delete(id)}else if(kind==='students'){if(await db.lessonPlans.where('studentId').equals(id).count())throw Error('STUDENT_REFERENCED');await db.students.delete(id)}else if(kind==='plans')await db.lessonPlans.delete(id)})}
export async function deleteActivitySafe(id){return db.transaction('rw',db.activities,db.collections,db.students,db.lessonPlans,async()=>{if(activityReferenced(id,{collections:await db.collections.toArray(),students:await db.students.toArray(),plans:await db.lessonPlans.toArray()}))throw Error('ACTIVITY_REFERENCED');await db.activities.delete(id)})}

// v3 adds session snapshots; previous stores and indexes are unchanged.
db.version(3).stores({activities:'id,resourceId,embedUrl,createdAt,updatedAt',collections:'id,name,updatedAt',students:'id,name,archivedAt,updatedAt',lessonPlans:'id,studentId,scheduledDate,status,updatedAt',teachingSessions:'id,status,studentId,planId,startedAt'});
import {makeSession,transition,isOpen} from './teaching.mjs';
export const listSessions=()=>db.teachingSessions.orderBy('startedAt').reverse().toArray();
export async function createSession(planId,includeBackup=false){return db.transaction('rw',db.teachingSessions,db.activities,db.students,db.lessonPlans,async()=>{const existing=(await db.teachingSessions.toArray()).find(isOpen);if(existing)throw Error('SESSION_EXISTS');const p=await db.lessonPlans.get(planId);if(!p)throw Error('PLAN_UNAVAILABLE');const s=makeSession(p,await db.activities.toArray(),await db.students.toArray(),includeBackup);await db.teachingSessions.add(s);await db.activities.update(s.items[0].activityId,{lastUsedAt:s.startedAt});return s})}
export async function changeSession(id,revision,action){return db.transaction('rw',db.teachingSessions,db.activities,async()=>{const s=await db.teachingSessions.get(id);if(!s||s.revision!==revision)throw Error('SESSION_STALE');const next=transition(s,action);await db.teachingSessions.put(next);if(action.type==='go')await db.activities.update(next.items[next.currentIndex].activityId,{lastUsedAt:new Date().toISOString()});return next})}

export async function createActivitySession(activityId){return db.transaction('rw',db.teachingSessions,db.activities,async()=>{if((await db.teachingSessions.toArray()).some(isOpen))throw Error('SESSION_EXISTS');const a=await db.activities.get(activityId);if(!a||a.archivedAt)throw Error('PLAN_UNAVAILABLE');const s=makeSession({id:null,title:a.title,status:'ready',items:[{activityId:a.id,duration:a.duration}]},[a],[],false);await db.teachingSessions.add(s);await db.activities.update(a.id,{lastUsedAt:s.startedAt});return s})}
