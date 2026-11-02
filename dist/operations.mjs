import {TYPES,PEOPLE,canReview,nextReviewers,live,active} from './domain.mjs';
import {relations} from './explorer.mjs';

export function nextAction(record,person,role){
 if(role==='Auditor')return 'Inspect record and decision history';
 if(record.status==='In review'){
  if(canReview(record,person))return 'Ready for your decision';
  return 'Waiting for '+nextReviewers(record).map(id=>PEOPLE.find(p=>p.id===id)?.name.split(' ')[0]).join(' & ');
 }
 return {'Draft':'Continue and submit','Changes requested':'Address the review feedback','Rejected':record.published?'Active version available · start a new change':'Review the rejection reason','Approved':'Available to build on'}[record.status]||record.status;
}
export function workBuckets(state,person,selectedRole){
 const role=selectedRole||PEOPLE.find(p=>p.id===person)?.role;
 const oldest=rows=>rows.sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));
 if(role==='Checker')return [
  {id:'ready',label:'Awaiting me',rows:oldest(state.records.filter(r=>canReview(r,person)))},
  {id:'waiting',label:'Earlier stage',rows:oldest(state.records.filter(r=>r.status==='In review'&&r.review.reviewers.includes(person)&&!r.review.decisions[person]&&!canReview(r,person)))},
  {id:'decided',label:'My decisions',rows:state.records.filter(r=>r.review.decisions[person]).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))}
 ];
 if(role==='Auditor')return [
  {id:'recent',label:'Recent changes',rows:[...state.records].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))},
  {id:'exceptions',label:'Returned & rejected',rows:state.records.filter(r=>['Changes requested','Rejected'].includes(r.status))},
  {id:'pending',label:'In review',rows:oldest(state.records.filter(r=>r.status==='In review'))}
 ];
 const own=state.records.filter(r=>r.owner===person);
 return [
  {id:'action',label:'Needs my attention',rows:oldest(own.filter(r=>r.status==='Changes requested')).concat(oldest(own.filter(r=>r.status==='Draft')))},
  {id:'progress',label:'In review',rows:oldest(own.filter(r=>r.status==='In review'))},
  {id:'active',label:'Active records',rows:own.filter(live)}
 ];
}
export function recordChanges(record){
 const keys=['name','description','refs','region','channel','segment','category','value','rule'];
 return keys.filter(k=>record[k]!==undefined&&(!record.published||JSON.stringify(record.published[k])!==JSON.stringify(record[k]))).map(key=>({field:key,before:record.published?.[key],after:record[key]}));
}
export function focusedRelations(state,id,activeOnly=false){
 const edges=relations(state).filter(e=>(e.from.id===id||e.to.id===id)&&(!activeOnly||e.status==='Approved'));
 return {incoming:edges.filter(e=>e.to.id===id),outgoing:edges.filter(e=>e.from.id===id)};
}
export function programFamilies(state,id){
 return ['brand','base','goto','variant','release','mapping'].map(type=>{
  const rows=state.records.filter(r=>r.type===type&&(r.refs.program===id||active(r).refs.program===id));
  return {type,label:TYPES[type].plural,rows,active:rows.filter(live).length,pending:rows.filter(r=>r.status==='In review').length};
 });
}
