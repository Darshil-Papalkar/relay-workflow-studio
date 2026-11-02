import {entityIndex,matchesEntity} from './navigation.mjs';
import {TYPES,find,active,live,matchRules} from './domain.mjs';

export function scopeRecords(state,program='all'){
 if(program==='all')return state.records;
 const p=find(state,program);
 return state.records.filter(r=>r.id===program||r.id===p?.refs.org||r.id===active(p)?.refs.org||r.refs.program===program||active(r).refs.program===program||['attribute','bin','ace','cpc'].includes(r.type));
}
export function searchEntities(state,{program='all',type='all',query=''}={}){
 const index=entityIndex(state);
 return scopeRecords(state,program).filter(r=>(type==='all'||r.type===type)&&matchesEntity(r,query,index));
}
export function relations(state){
 const result=[],index=entityIndex(state);
 const endpoint=(r,capture)=>({...active(r),...(capture?{name:capture.name||active(r).name,version:capture.version}:{}),id:r.id,type:r.type,code:r.code});
 for(const r of state.records){
   for(const [role,id] of Object.entries(r.refs)){
     const parent=index.get(id);if(!parent)continue;
     const alreadyActive=r.published&&r.published.refs[role]===id;
     const snapshot=alreadyActive?r.published:r;
     const capture=(alreadyActive||['Approved','In review'].includes(r.status))?snapshot.submittedRefs?.[role]:null;
     result.push({id:r.id+'-'+role,from:endpoint(parent,capture),to:alreadyActive?active(r):r,kind:r.type==='mapping'&&['brand','bin','ace','cpc'].includes(role)?'Brand mapping':'Required parent',status:alreadyActive?'Approved':r.status,version:alreadyActive?r.published.version:r.version});
   }
   if(r.published)for(const [role,id] of Object.entries(r.published.refs)){
     if(r.refs[role]===id)continue;
     const parent=index.get(id);if(parent)result.push({id:r.id+'-'+role+'-active',from:endpoint(parent,r.published.submittedRefs?.[role]),to:active(r),kind:'Active parent',status:'Approved',version:r.published.version});
   }
   if(r.type==='release'){
     const snapshots=[];
     if(live(r))snapshots.push({attrs:active(r).attributes||[],status:'Approved',version:active(r).version,kind:'Captured attribute'});
     if(r.status==='In review')snapshots.push({attrs:r.proposedAttributes||[],status:'In review',version:r.version,kind:'Submitted attribute'});
     else if(r.status!=='Approved'&&r.status!=='Rejected')snapshots.push({attrs:matchRules(state,r).matches.map(m=>({id:m.rule.id,name:m.rule.name,version:m.rule.version})),status:r.status,version:r.version,kind:'Attribute preview'});
     snapshots.forEach(s=>s.attrs.forEach(a=>{const from=index.get(a.id);if(from)result.push({id:r.id+'-rule-'+a.id+'-'+s.kind,from:endpoint(from,a),to:s.status==='Approved'?active(r):r,kind:s.kind,status:s.status,version:s.version,ruleVersion:a.version});}));
   }
 }
 return result;
}
export function searchRelations(state,{program='all',type='all',query='',entity=''}={}){
 const scoped=new Set(scopeRecords(state,program).map(r=>r.id)),q=query.trim().toLowerCase();
 return relations(state).filter(e=>scoped.has(e.to.id)&&(type==='all'||e.from.type===type||e.to.type===type)&&(!entity||e.from.id===entity||e.to.id===entity)&&(!q||[e.from.name,e.from.code,TYPES[e.from.type].label,e.to.name,e.to.code,TYPES[e.to.type].label,e.kind].join(' ').toLowerCase().includes(q)));
}
