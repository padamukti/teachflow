export const defaults = { language:'id', theme:'light', view:'grid' };
export function normalizePreferences(input={}) {
  return {language: ['id','en'].includes(input?.language)?input.language:defaults.language,
    theme:['light','dark','system'].includes(input?.theme)?input.theme:defaults.theme,
    view:['grid','list'].includes(input?.view)?input.view:defaults.view};
}
export function normalizeMetadata(input={}) {
  const text=(value,max=300)=>String(value??'').trim().slice(0,max);
  const title=text(input.title); if(!title) throw new Error('TITLE_REQUIRED');
  const duration=input.duration===''||input.duration==null?null:Number(input.duration);
  if(duration!==null&&(!Number.isInteger(duration)||duration<1||duration>600)) throw new Error('DURATION_INVALID');
  return {title,category:text(input.category,100),level:text(input.level,100),template:text(input.template,100),tags:[...new Set((Array.isArray(input.tags)?input.tags:String(input.tags??'').split(',')).map(t=>text(t,60)).filter(Boolean))].slice(0,30),notes:text(input.notes,5000),duration};
}
export function filterActivities(items,{query='',category='',level='',template='',status='active',favorite=false,sort='newest'}={}) {
  const lower=s=>String(s??'').normalize('NFKC').toLocaleLowerCase();
  const terms=lower(query).trim().split(/\s+/).filter(Boolean);
  const result=items.filter(a=>{
    if(status==='active'&&a.archivedAt||status==='archived'&&!a.archivedAt) return false;
    if(category&&a.category!==category||level&&a.level!==level||template&&a.template!==template||favorite&&!a.favorite) return false;
    const text=lower([a.title,a.category,a.level,a.template,a.authorName,...(a.tags||[])].join(' '));
    return terms.every(term=>text.includes(term));
  });
  return result.sort((a,b)=>sort==='title'?String(a.title).localeCompare(String(b.title)):sort==='used'?String(b.lastUsedAt||'').localeCompare(String(a.lastUsedAt||''))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')):String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
}
export function getRoute(hash) {const route=String(hash||'').replace(/^#\/?/,'');return ['dashboard','activities','settings','player','explore','collections','students','plans','favorites','teaching','history'].includes(route)?route:'dashboard';}
