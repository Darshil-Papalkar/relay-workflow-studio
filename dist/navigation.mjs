import {TYPES,active,live} from './domain.mjs';

export function entityIndex(state){return new Map(state.records.map(r=>[r.id,r]));}
export function entityContext(record,index,{approved=false}={}){
 const r=approved?active(record):record, parts=[],seen=new Set([r.id]);
 const visit=id=>{if(!id||seen.has(id))return;seen.add(id);const p=index.get(id);if(!p)return;const v=approved?active(p):p;for(const parent of Object.values(v.refs||{}))visit(parent);parts.push(v.name+' · '+p.code);};
 for(const id of Object.values(r.refs||{}))visit(id);
 return parts.join(' / ');
}
export function matchesEntity(record,query,index,{approved=false}={}){
 const q=query.trim().toLocaleLowerCase(),r=approved?active(record):record;
 const text=[r.name,record.code,record.id,TYPES[r.type]?.label,TYPES[r.type]?.plural,r.description,entityContext(record,index,{approved})].join(' ').toLocaleLowerCase();
 return !q||q.split(/\s+/).every(term=>text.includes(term));
}
export function sortEntities(rows,sort='name'){
 return [...rows].sort((a,b)=>{
  const order=sort==='updated'?(b.updatedAt||'').localeCompare(a.updatedAt||''):sort==='oldest'?(a.updatedAt||'').localeCompare(b.updatedAt||''):a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'});
  return order||a.code.localeCompare(b.code,undefined,{numeric:true})||a.id.localeCompare(b.id);
 });
}
export function belongsToOrg(record,org,index,{approved=false}={}){
 if(org==='all')return true;
 return (approved?[active(record)]:[record,active(record)]).some(r=>r.id===org||r.refs?.org===org||(approved?[active(index.get(r.refs?.program))]:[index.get(r.refs?.program),active(index.get(r.refs?.program))]).some(p=>p?.refs?.org===org));
}
export function filterRecords(state,{query='',type='all',status='all',program='all',org='all',sort='updated'}={}){
 const index=entityIndex(state);
 return sortEntities(state.records.filter(r=>(type==='all'||r.type===type)&&(status==='all'||r.status===status)&&(program==='all'||r.id===program||r.refs?.program===program||active(r).refs?.program===program)&&belongsToOrg(r,org,index)&&matchesEntity(r,query,index)),sort);
}
export function pickerChoices(state,{type,org='all',program='all',approved=false,query=''}={}){
 const index=entityIndex(state);
 return sortEntities(state.records.filter(r=>(!type||r.type===type)&&(!approved||live(r))&&belongsToOrg(r,org,index,{approved})&&(program==='all'||active(r).refs?.program===program||(!approved&&r.refs?.program===program))&&matchesEntity(r,query,index,{approved})).map(r=>approved?{...active(r),id:r.id,code:r.code,status:'Approved'}:r));
}
export function paginate(rows,{page=1,pageSize=25}={}){
 const size=[10,25,50,100].includes(Number(pageSize))?Number(pageSize):25,total=rows.length,pageCount=Math.max(1,Math.ceil(total/size)),current=Math.min(pageCount,Math.max(1,Math.trunc(Number(page))||1)),start=(current-1)*size;
 return {items:rows.slice(start,start+size),total,page:current,pageSize:size,pageCount,from:total?start+1:0,to:Math.min(start+size,total)};
}
