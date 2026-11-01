export const TYPES = {
  org:{label:'Partner organisation',plural:'Partner organisations',short:'Organisation',icon:'building',group:'Partner setup',prefix:'ORG',deps:[],hint:'The partner at the root of your ecosystem.'},
  program:{label:'Partner program',plural:'Partner programs',short:'Program',icon:'layers',group:'Partner setup',prefix:'PRG',deps:['org'],hint:'Connect a commercial program to an approved partner.'},
  brand:{label:'Brand',plural:'Brands',short:'Brand',icon:'diamond',group:'Products & releases',prefix:'BRD',deps:['program'],hint:'Create a brand within a partner program.'},
  base:{label:'Base product',plural:'Base products',short:'Base product',icon:'box',group:'Products & releases',prefix:'BAS',deps:['program','brand'],hint:'Define the core product under a program and brand.'},
  goto:{label:'Go-to product',plural:'Go-to products',short:'Go-to product',icon:'rocket',group:'Products & releases',prefix:'GTO',deps:['program'],hint:'A separate product branch attached to a program.'},
  variant:{label:'Product variant',plural:'Product variants',short:'Product variant',icon:'package',group:'Products & releases',prefix:'VAR',deps:['program','base'],hint:'Configure a variant from a base product.'},
  release:{label:'Release configuration',plural:'Release configurations',short:'Release',icon:'tag',group:'Products & releases',prefix:'REL',deps:['program','variant'],hint:'Configure a release and preview matching attributes.'},
  attribute:{label:'Attribute configuration',plural:'Attribute configurations',short:'Attribute rule',icon:'sliders',group:'Shared configurations',prefix:'ATR',deps:[],hint:'Match releases automatically using explicit parameters.'},
  bin:{label:'BIN',plural:'BINs',short:'BIN',icon:'card',group:'Shared configurations',prefix:'BIN',deps:[],hint:'A reusable bank identification number configuration.'},
  ace:{label:'ACE option set',plural:'ACE option sets',short:'ACE option set',icon:'grid',group:'Shared configurations',prefix:'ACE',deps:[],hint:'A reusable option set, mapped to brands separately.'},
  cpc:{label:'CPC',plural:'CPC configurations',short:'CPC',icon:'settings',group:'Shared configurations',prefix:'CPC',deps:[],hint:'A shared CPC record, mapped to brands separately.'},
  mapping:{label:'Brand configuration mapping',plural:'Brand mappings',short:'Brand mapping',icon:'link',group:'Shared configurations',prefix:'MAP',deps:['program','brand','bin','ace','cpc'],hint:'Approve which shared configurations a brand can use.'}
};
export const PEOPLE = [
 {id:'maker',name:'Aanya Shah',initials:'AS',role:'Maker',title:'Operations specialist',color:'plum'},
 {id:'checker1',name:'Nisha Rao',initials:'NR',role:'Checker',title:'Operations reviewer',color:'blue'},
 {id:'checker2',name:'Dev Mehta',initials:'DM',role:'Checker',title:'Risk reviewer',color:'orange'},
 {id:'auditor',name:'Mira Kapoor',initials:'MK',role:'Auditor',title:'Audit & oversight',color:'green'}
];
export const STATUS = {'Draft':'neutral','In review':'amber','Approved':'green','Changes requested':'rose','Rejected':'rose'};
const ago = (h) => new Date(Date.now()-h*3600000).toISOString();
export function seed(){
 const policies=Object.fromEntries(Object.keys(TYPES).map(t=>[t,{mode:['brand','bin','ace','cpc'].includes(t)?'parallel':'sequential',reviewers:['checker1','checker2']}]));
 const list = [
 ['org','org1','Northstar Partners','Approved',{},'Service delivery partner'],['org','org2','Crescent Group','Approved',{},'Experience services partner'],
 ['program','prg1','Core Services','Approved',{org:'org1'},'Everyday value, thoughtfully connected'],['program','prg2','Experience Services','Approved',{org:'org1'},'Travel, experiences and a little more'],['program','prg3','Crescent Connect','In review',{org:'org2'},'Premium partner services'],
 ['brand','brd1','Northstar Select','Approved',{program:'prg1'},'Premium service line'],['brand','brd2','Northstar Essentials','Approved',{program:'prg1'},'Essential services'],['brand','brd3','Wander','Approved',{program:'prg2'},'For the next destination'],
 ['base','bas1','Select Platinum','Approved',{program:'prg1',brand:'brd1'},'A configurable service foundation'],['base','bas2','Essentials Classic','Approved',{program:'prg1',brand:'brd2'},'Simple, useful services'],['base','bas3','Wander Signature','In review',{program:'prg2',brand:'brd3'},'Designed for curious travellers'],
 ['goto','gto1','Everyday Digital','Approved',{program:'prg1'},'Digital product channel'],['goto','gto2','Travel Companion','Draft',{program:'prg2'},'Your journey, connected'],
 ['variant','var1','Select Plus variant','Approved',{program:'prg1',base:'bas1'},'Configured variant of Select Platinum'],['variant','var2','Essentials Standard variant','Approved',{program:'prg1',base:'bas2'},'Configured variant of Essentials Classic'],
 ['release','rel1','Regional launch','In review',{program:'prg1',variant:'var1'},'Digital release configuration for the selected region'],['release','rel2','Core digital release','Approved',{program:'prg1',variant:'var1'},'Core digital service configuration'],['release','rel3','Essentials expansion','Changes requested',{program:'prg1',variant:'var2'},'Additional regional service configuration'],['release','rel4','Seasonal rollout','Draft',{program:'prg1',variant:'var1'},'Configuration for the seasonal rollout'],
 ['attribute','atr1','India · premium support','Approved',{},'Apply support settings to eligible releases'],['attribute','atr2','Digital experience','Approved',{},'Digital service settings and communications'],['attribute','atr3','Experience services','Draft',{},'Settings for experience-category releases'],
 ['bin','bin1','Primary BIN · 412345','Approved',{},'Primary issuing configuration'],['bin','bin2','Secondary BIN · 523456','In review',{},'Secondary issuing configuration'],
 ['ace','ace1','Core service options','Approved',{},'Onboarding, support and reporting options'],['ace','ace2','Experience service options','Approved',{},'Priority support and extended reporting'],
 ['cpc','cpc1','Standard retail CPC','Approved',{},'Retail program configuration'],
 ['mapping','map1','Select · retail configuration','Approved',{program:'prg1',brand:'brd1',bin:'bin1',ace:'ace1',cpc:'cpc1'},'Connect Select to its approved shared configurations'],
 ['mapping','map2','Essentials · retail configuration','Approved',{program:'prg1',brand:'brd2',bin:'bin1',ace:'ace1',cpc:'cpc1'},'Reuse shared configurations for a second brand']
 ];
 const records=list.map((a,i)=>({id:a[1],type:a[0],name:a[2],status:a[3],refs:a[4],description:a[5],code:TYPES[a[0]].prefix+'-'+String(1001+i),owner:'maker',createdAt:ago(120-i*2),updatedAt:ago(48-i),version:1,region:'India',channel:'Digital',segment:'Premium',category:a[1]==='rel1'?'Regional':'Everyday',review:{...structuredClone(policies[a[0]]),decisions:{}},history:[],attributes:[]}));
 records.find(r=>r.id==='atr1').rule={field:'segment',value:'Premium',key:'Support tier',output:'Priority',priority:10};
 records.find(r=>r.id==='atr2').rule={field:'channel',value:'Digital',key:'Welcome experience',output:'Digital welcome kit',priority:20};
 records.find(r=>r.id==='atr3').rule={field:'category',value:'Travel',key:'Support tier',output:'Specialist',priority:10};
 records.find(r=>r.id==='bin1').value='412345'; records.find(r=>r.id==='bin2').value='523456';
 records.find(r=>r.id==='ace1').value='Onboarding, support, reporting';records.find(r=>r.id==='ace2').value='Priority support, extended reporting';records.find(r=>r.id==='cpc1').value='RETAIL-STD';
 records.find(r=>r.id==='rel1').review.decisions.checker1={action:'approve',comment:'Configuration and references checked. Ready for risk review.',at:ago(3)};
 for(const r of records){
   r.history.push({id:'h-'+r.id+'-1',action:'Draft created',actor:'maker',at:r.createdAt,version:1,detail:'Created '+TYPES[r.type].label.toLowerCase()+'.'});
   if(r.status!=='Draft')r.history.push({id:'h-'+r.id+'-2',action:'Submitted for approval',actor:'maker',at:ago(50-records.indexOf(r)),version:1,detail:r.review.mode==='parallel'?'Sent to operations and risk reviewers in parallel.':'Sent to operations, followed by risk review.'});
   if(r.status==='Approved'){for(const p of r.review.reviewers){r.review.decisions[p]={action:'approve',at:ago(30-records.indexOf(r)),comment:'Reviewed and approved.'};r.history.push({id:'h-'+r.id+'-'+p,action:'Approved',actor:p,at:ago(30-records.indexOf(r)),version:1,detail:'Reviewed and approved.'});}}
   if(r.id==='rel1')r.history.push({id:'h-rel1-partial',action:'Stage approved',actor:'checker1',at:ago(3),version:1,detail:'Configuration and references checked. Ready for risk review.'});
   if(r.status==='Changes requested')r.history.push({id:'h-'+r.id+'-return',action:'Changes requested',actor:'checker1',at:ago(2),version:1,detail:'Please clarify the configuration details before we proceed.'});
 }
 const state={records,policies,events:[],schema:1};
 records.filter(r=>r.type==='release'&&r.status!=='Draft').forEach(r=>{const snapshot=matchRules(state,r).matches.map(m=>({id:m.rule.id,name:m.rule.name,version:m.rule.version,key:m.rule.rule.key,value:m.rule.rule.output}));if(r.status==='Approved')r.attributes=snapshot;else r.proposedAttributes=snapshot;});
 records.filter(r=>r.status!=='Draft').forEach(r=>r.submittedRefs=Object.fromEntries(Object.entries(r.refs).map(([key,id])=>{const p=active(find(state,id));return [key,{id:p.id,name:p.name,code:p.code,version:p.version}];})));
 return state;
}
export function find(state,id){return state.records.find(r=>r.id===id)}
export function live(r){return !!r && (r.status==='Approved'||!!r.published)}
export function active(r){return r?.published||r}
export function policyFor(state,type){return structuredClone(state.policies[type])}
export function blockers(state,r){
 const out=[];
 for(const dep of TYPES[r.type].deps){const p=find(state,r.refs[dep]);if(!p)out.push('Select '+TYPES[dep].label.toLowerCase()+'.');else if(!live(p))out.push(p.name+' must be approved first.');}
 for(const dep of ['brand','base','variant']){const p=active(find(state,r.refs[dep]));if(p&&p.refs.program!==r.refs.program)out.push(TYPES[dep].label+' belongs to a different program.');}
 if(!r.name?.trim())out.push('Add a name.');
 if(r.published&&state.records.some(c=>live(c)&&Object.values(active(c).refs).includes(r.id))&&JSON.stringify(r.refs)!==JSON.stringify(r.published.refs))out.push('This record has active children. Keep its parent connections unchanged; moving the family needs a separate migration.');
 if(r.type==='bin'&&!/^\d{6}(\d{2})?$/.test(r.value||''))out.push('Enter a 6- or 8-digit BIN.');
 if(['ace','cpc'].includes(r.type)&&!r.value?.trim())out.push('Add the configuration value.');
 if(r.type==='attribute'&&(!r.rule?.value?.trim()||!r.rule?.key?.trim()||!r.rule?.output?.trim()))out.push('Complete the matching condition and attribute value.');
 if(r.type==='attribute'&&(!Number.isFinite(Number(r.rule?.priority))||Number(r.rule.priority)<0||Number(r.rule.priority)>100))out.push('Rule priority must be between 0 and 100.');
 if(r.type==='release'&&r.status!=='In review'&&matchRules(state,r).conflicts.length)out.push('Resolve overlapping attribute rules with equal priority.');
 if((r.review?.reviewers||[]).includes(r.owner))out.push('The maker cannot review their own request.');
 if(!r.review?.reviewers?.length)out.push('Assign at least one reviewer.');
 return out;
}
export function eligible(state,dep,program){return state.records.filter(r=>r.type===dep&&live(r)&&(!['brand','base','variant'].includes(dep)||active(r).refs.program===program));}
export function canReview(r,actor){
 if(r.status!=='In review'||r.owner===actor||!r.review.reviewers.includes(actor)||r.review.decisions[actor])return false;
 if(r.review.mode==='parallel')return true;
 const first=r.review.reviewers.find(p=>!r.review.decisions[p]);return first===actor;
}
export function nextReviewers(r){if(r.status!=='In review')return []; const ids=r.review.reviewers.filter(p=>!r.review.decisions[p]);return r.review.mode==='parallel'?ids:ids.slice(0,1)}
export function addEvent(state,r,action,actor,detail,changes=[]){const e={id:'evt-'+crypto.randomUUID(),action,actor,detail,changes,at:new Date().toISOString(),version:r.version};r.history.unshift(e);r.updatedAt=e.at;return e;}
export function matchRules(state,release){
 const evaluated=state.records.filter(r=>r.type==='attribute'&&live(r)).map(r=>active(r)).map(rule=>({rule,matched:String(release[rule.rule.field]||'').toLowerCase()===rule.rule.value.toLowerCase()}));
 const candidates=evaluated.filter(x=>x.matched), groups=Object.create(null);candidates.forEach(m=>(groups[m.rule.rule.key]??=[]).push(m));
 const matches=[],conflicts=[];
 Object.entries(groups).forEach(([key,g])=>{g.sort((a,b)=>Number(b.rule.rule.priority)-Number(a.rule.rule.priority));const same=g.filter(x=>Number(x.rule.rule.priority)===Number(g[0].rule.rule.priority));if(same.length>1&&new Set(same.map(x=>x.rule.rule.output)).size>1)conflicts.push(key);else matches.push(g[0]);});
 return {evaluated,matches,conflicts};
}
export function saveDraft(state,input,actor,existingId){
 if(actor!=='maker')throw Error('Only makers can edit a request.');
 let r=find(state,existingId); if(r&&!['Draft','Changes requested'].includes(r.status))throw Error('This version is locked. Propose a change to edit it.');
 const before=r?structuredClone(r):null;
 if(!r){const type=input.type;r={id:type+'-'+crypto.randomUUID().slice(0,8),code:TYPES[type].prefix+'-'+(1000+state.records.length+1),type,owner:actor,version:1,createdAt:new Date().toISOString(),history:[],attributes:[],review:policyFor(state,type)};state.records.push(r);}
 Object.assign(r,input,{status:'Draft',review:{...policyFor(state,input.type),decisions:{}}});
 const changes=before?Object.keys(input).filter(k=>JSON.stringify(before[k])!==JSON.stringify(input[k])).map(k=>({field:k,before:before[k],after:input[k]})):[];
 addEvent(state,r,before?'Draft updated':'Draft created',actor,before?'Saved changes to this draft.':'Created '+TYPES[r.type].label.toLowerCase()+'.',changes);return r;
}
export function submit(state,id,actor){const r=find(state,id);if(!r||r.owner!==actor||!['Draft','Changes requested'].includes(r.status))throw Error('Only the maker can submit an editable draft.');const reasons=blockers(state,r);if(reasons.length)throw Error(reasons.join(' '));r.status='In review';r.review.decisions={};r.submittedRefs=Object.fromEntries(Object.entries(r.refs).map(([key,id])=>{const p=active(find(state,id));return [key,{id:p.id,name:p.name,code:p.code,version:p.version}];}));if(r.type==='release')r.proposedAttributes=matchRules(state,r).matches.map(m=>({id:m.rule.id,name:m.rule.name,version:m.rule.version,key:m.rule.rule.key,value:m.rule.rule.output}));addEvent(state,r,'Submitted for approval',actor,'Approval policy captured: '+r.review.mode+' · '+r.review.reviewers.map(p=>PEOPLE.find(x=>x.id===p).name).join(', ')+'.');return r;}
export function decide(state,id,actor,action,comment){
 const r=find(state,id);if(!r||!canReview(r,actor))throw Error('This request is not currently assigned to you.');
 if(!['approve','return','reject'].includes(action))throw Error('Choose a valid review decision.');
 if(action!=='approve'&&!comment.trim())throw Error('Add a reason so the maker knows what to do next.');
 if(action==='approve'){const b=blockers(state,r);if(b.length)throw Error(b.join(' '));}
 r.review.decisions[actor]={action,comment,at:new Date().toISOString()};
 if(action==='return'){r.status='Changes requested';addEvent(state,r,'Changes requested',actor,comment);}
 else if(action==='reject'){r.status='Rejected';addEvent(state,r,'Rejected',actor,comment);}
 else {const done=r.review.reviewers.every(p=>r.review.decisions[p]?.action==='approve');if(done){r.status='Approved';delete r.published;if(r.type==='release'){r.attributes=r.proposedAttributes||[];delete r.proposedAttributes;}}addEvent(state,r,done?'Approved':'Stage approved',actor,comment||'Reviewed and approved.');}
 return r;
}
export function amend(state,id,actor){
 const r=find(state,id);
 if(actor!==r?.owner||!(r.status==='Approved'||r.status==='Rejected'&&r.published))throw Error('Only the maker can propose a change to an active record.');
 const history=r.history,version=r.version+1,published=structuredClone({...active(r),history:[]}),rejected=r.status==='Rejected';
 if(rejected){const previous=structuredClone(r);Object.assign(r,structuredClone(published));r.history=history;r.version=previous.version;addEvent(state,r,'Rejected proposal archived',actor,'The rejected request v'+previous.version+' is retained in history. A new proposal starts from active v'+published.version+'.',[{field:'Rejected proposal',before:{name:previous.name,description:previous.description,refs:previous.refs,region:previous.region,channel:previous.channel,segment:previous.segment,category:previous.category,value:previous.value,rule:previous.rule},after:null}]);}
 r.published=published;r.version=version;r.status='Draft';r.review={...policyFor(state,r.type),decisions:{}};delete r.proposedAttributes;
 addEvent(state,r,'Change proposed',actor,'Version '+published.version+' stays active while this change is reviewed.');return r;
}
export function allEvents(state){return [...state.records.flatMap(r=>r.history.map(e=>({...e,recordId:r.id,recordName:r.name,type:r.type,code:r.code}))),...state.events].sort((a,b)=>b.at.localeCompare(a.at));}
