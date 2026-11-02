import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,find,live,active,eligible,blockers,saveDraft,submit,decide,canReview,amend,matchRules} from './dist/domain.mjs';
import {relations,searchEntities,searchRelations,scopeRecords} from './dist/explorer.mjs';
const draft=(s,type,refs={},extra={})=>saveDraft(s,{type,name:'Test '+type,description:'Verification record',refs,region:'India',channel:'Digital',segment:'Premium',category:'Everyday',...extra},'maker');

test('one organisation can have multiple programs, and one product multiple releases',()=>{
 const s=seed(); const a=draft(s,'program',{org:'org1'}),b=draft(s,'program',{org:'org1'});submit(s,a.id,'maker');submit(s,b.id,'maker');assert.notEqual(a.id,b.id);
 const releases=Array.from({length:3},()=>draft(s,'release',{program:'prg1',variant:'var1'}));releases.forEach(r=>submit(s,r.id,'maker'));assert.equal(new Set(releases.map(r=>r.id)).size,3);
 assert.ok(eligible(s,'variant','prg1').some(r=>r.id==='var1'));
});
test('configurations are reusable through independently approved brand mappings',()=>{
 const s=seed();const a=find(s,'map1'),b=find(s,'map2');assert.notEqual(a.refs.brand,b.refs.brand);assert.equal(a.refs.bin,b.refs.bin);assert.equal(a.refs.ace,b.refs.ace);assert.equal(a.refs.cpc,b.refs.cpc);
 const r=draft(s,'mapping',{...b.refs});submit(s,r.id,'maker');decide(s,r.id,'checker1','approve','');assert.equal(r.status,'In review');assert.equal(a.status,'Approved');
});
test('sequential approval locks later stages and rejects maker self-approval',()=>{
 const s=seed(),r=draft(s,'program',{org:'org1'});submit(s,r.id,'maker');assert.equal(canReview(r,'maker'),false);assert.equal(canReview(r,'checker2'),false);assert.throws(()=>decide(s,r.id,'checker2','approve',''));
 decide(s,r.id,'checker1','approve','Checked');assert.equal(r.status,'In review');assert.equal(canReview(r,'checker2'),true);decide(s,r.id,'checker2','approve','');assert.equal(r.status,'Approved');
});
test('parallel approval allows either reviewer first but requires both',()=>{
 const s=seed(),r=draft(s,'brand',{program:'prg1'});submit(s,r.id,'maker');assert.equal(canReview(r,'checker2'),true);decide(s,r.id,'checker2','approve','');assert.equal(r.status,'In review');decide(s,r.id,'checker1','approve','');assert.equal(r.status,'Approved');
});
test('a one-reviewer policy completes in one decision and in-flight routes stay frozen',()=>{
 const s=seed();s.policies.org={mode:'parallel',reviewers:['checker1']};const r=draft(s,'org');submit(s,r.id,'maker');s.policies.org.reviewers.push('checker2');assert.deepEqual(r.review.reviewers,['checker1']);decide(s,r.id,'checker1','approve','');assert.equal(r.status,'Approved');
});
test('unapproved and cross-program parents block submission',()=>{
 const s=seed(),r=draft(s,'base',{program:'prg1',brand:'brd3'});assert.ok(blockers(s,r).some(x=>x.includes('different program')));assert.throws(()=>submit(s,r.id,'maker'));
 const child=draft(s,'brand',{program:'prg3'});assert.ok(blockers(s,child).some(x=>x.includes('approved first')));
});
test('change requests require a reason and resubmission resets earlier decisions',()=>{
 const s=seed(),r=draft(s,'program',{org:'org1'});submit(s,r.id,'maker');decide(s,r.id,'checker1','approve','');assert.throws(()=>decide(s,r.id,'checker2','return',''));decide(s,r.id,'checker2','return','Clarify the terms');assert.equal(r.status,'Changes requested');
 saveDraft(s,{type:r.type,name:'Updated',description:'Clear terms',refs:r.refs},'maker',r.id);submit(s,r.id,'maker');assert.deepEqual(r.review.decisions,{});assert.equal(canReview(r,'checker1'),true);
});
test('approved versions stay available during an amendment and after rejection',()=>{
 const s=seed();const r=amend(s,'brd1','maker');r.name='Proposed name';assert.equal(active(r).name,'Northstar Select');assert.equal(live(r),true);assert.ok(eligible(s,'brand','prg1').some(x=>x.id===r.id));submit(s,r.id,'maker');decide(s,r.id,'checker1','reject','Do not change the name');assert.equal(r.status,'Rejected');assert.equal(active(r).name,'Northstar Select');
});
test('reparenting a record with live children is blocked',()=>{
 const s=seed(),r=amend(s,'brd1','maker');r.refs.program='prg2';assert.ok(blockers(s,r).some(x=>x.includes('active children')));assert.throws(()=>submit(s,r.id,'maker'));
});
test('seeded pending releases publish the attributes shown in their submitted snapshot',()=>{
 const s=seed(),r=find(s,'rel1');assert.equal(r.proposedAttributes.length,2);decide(s,r.id,'checker2','approve','');assert.equal(r.attributes.length,2);
});
test('attribute matching handles arbitrary keys and conflicting equal-priority rules',()=>{
 const s=seed();find(s,'atr1').rule.key='constructor';assert.doesNotThrow(()=>matchRules(s,find(s,'rel1')));
 const copy=structuredClone(find(s,'atr1'));copy.id='conflict';copy.rule.output='99× points';s.records.push(copy);assert.deepEqual(matchRules(s,find(s,'rel1')).conflicts,['constructor']);const r=draft(s,'release',{program:'prg1',variant:'var1'});assert.throws(()=>submit(s,r.id,'maker'));
});
test('release snapshots and reference versions are frozen at submission',()=>{
 const s=seed(),r=draft(s,'release',{program:'prg1',variant:'var1'});submit(s,r.id,'maker');assert.equal(r.submittedRefs.variant.version,1);find(s,'atr1').rule.output='Changed later';find(s,'atr1').version=2;decide(s,r.id,'checker1','approve','');decide(s,r.id,'checker2','approve','');assert.ok(r.attributes.some(x=>x.value==='Priority'&&x.version===1));
});
test('auditor cannot create and every draft update records field differences',()=>{
 const s=seed();assert.throws(()=>saveDraft(s,{type:'org',name:'Not allowed',refs:{}},'auditor'));const r=draft(s,'org');saveDraft(s,{type:'org',name:'Changed name',description:'',refs:{}},'maker',r.id);assert.ok(r.history[0].changes.some(c=>c.field==='name'&&c.after==='Changed name'));
});

test('the explorer lists repeated parent usage, both brand mappings, and captured attribute edges',()=>{
 const s=seed(),edges=relations(s);
 assert.equal(edges.filter(e=>e.from.id==='org1').length,2);
 assert.equal(edges.filter(e=>e.from.id==='bin1').length,2);
 assert.equal(edges.filter(e=>e.from.id==='var1').length,3);
 assert.ok(edges.some(e=>e.from.id==='atr1'&&e.to.id==='rel2'&&e.kind==='Captured attribute'&&e.ruleVersion===1));
});
test('entity search finds names, IDs and types, including unconnected standalone records',()=>{
 const s=seed();assert.ok(searchEntities(s,{query:'northstar'}).length>1);
 assert.deepEqual(searchEntities(s,{query:find(s,'ace2').code}).map(r=>r.id),['ace2']);
 assert.equal(searchEntities(s,{query:'base product'}).length,3);
 assert.ok(searchEntities(s,{type:'attribute'}).some(r=>r.id==='atr3'));
});
test('focused relationship search returns incoming and all outgoing connections',()=>{
 const s=seed(),edges=searchRelations(s,{entity:'var1'});
 assert.equal(new Set(edges.filter(e=>e.from.id==='var1').map(e=>e.to.id)).size,3);
 assert.ok(edges.some(e=>e.from.id==='bas1'&&e.to.id==='var1'));
 assert.ok(edges.every(e=>e.to.id==='var1'||e.from.id==='var1'));
});
test('program filters preserve shared configurations while excluding other programs releases',()=>{
 const s=seed();assert.ok(scopeRecords(s,'prg2').some(r=>r.id==='bin1'));
 assert.ok(!searchRelations(s,{program:'prg2'}).some(e=>e.to.id==='rel1'));
 assert.ok(searchRelations(s,{program:'prg2'}).some(e=>e.to.id==='bas3'));
});

import {workBuckets,recordChanges,focusedRelations,programFamilies} from './dist/operations.mjs';

test('checker work queues separate actionable requests from earlier sequential stages',()=>{
 const s=seed(),b=workBuckets(s,'checker2');
 assert.ok(b[0].rows.some(r=>r.id==='rel1'));
 assert.ok(!b[0].rows.some(r=>r.id==='prg3'));
 assert.ok(b.find(b=>b.id==='waiting').rows.some(r=>r.id==='prg3'));
 b[0].rows.forEach(r=>assert.ok(canReview(r,'checker2')));
 assert.equal(workBuckets(s,'maker')[0].rows[0].status,'Changes requested');
 assert.ok(workBuckets(s,'auditor').find(b=>b.id==='exceptions').rows.every(r=>['Changes requested','Rejected'].includes(r.status)));
});
test('program families retain all branches rather than one representative per type',()=>{
 const s=seed();draft(s,'brand',{program:'prg1'},{name:'Another brand'});
 const f=programFamilies(s,'prg1');
 assert.equal(f.find(x=>x.type==='brand').rows.length,3);
 assert.equal(f.find(x=>x.type==='goto').rows.length,1);
 assert.equal(f.find(x=>x.type==='release').rows.length,4);
 assert.ok(f.flatMap(x=>x.rows).every(r=>r.refs.program==='prg1'));
});
test('focused map uses all real fan-out and shared configuration edges',()=>{
 const s=seed(),f=focusedRelations(s,'var1');
 assert.equal(f.incoming.length,2);assert.equal(f.outgoing.length,3);
 assert.equal(focusedRelations(s,'var1',true).outgoing.length,1);
 assert.deepEqual(new Set(focusedRelations(s,'bin1').outgoing.map(e=>e.to.id)),new Set(['map1','map2']));
 assert.equal(focusedRelations(s,'rel1').incoming.filter(e=>e.ruleVersion).length,2);
});
test('active relationship labels stay on their captured versions during proposals',()=>{
 const s=seed();amend(s,'prg1','maker');find(s,'prg1').name='Unapproved program name';
 amend(s,'rel2','maker');find(s,'rel2').name='Unapproved release name';
 const activeEdges=focusedRelations(s,'rel2',true).incoming;
 assert.ok(activeEdges.every(e=>e.to.name==='Core digital release'));
 assert.equal(activeEdges.find(e=>e.from.id==='prg1').from.name,'Core Services');
 amend(s,'atr1','maker');find(s,'atr1').name='Unapproved rule name';
 assert.equal(focusedRelations(s,'rel2',true).incoming.find(e=>e.from.id==='atr1').from.name,'India · premium support');
});
test('net change comparison tracks active versus latest draft after several saves',()=>{
 const s=seed(),r=amend(s,'rel2','maker'),original=r.published.name;
 saveDraft(s,{...r,name:'Proposal A'},'maker',r.id);saveDraft(s,{...r,name:'Proposal B'},'maker',r.id);
 const change=recordChanges(r).find(c=>c.field==='name');
 assert.equal(change.before,original);assert.equal(change.after,'Proposal B');
});
test('a rejected amendment can restart from its active version without losing rejected history',()=>{
 const s=seed(),r=amend(s,'rel2','maker'),original=r.name;r.name='Rejected proposed name';submit(s,r.id,'maker');decide(s,r.id,'checker1','reject','Incorrect name');
 const beforeEvents=r.history.length;amend(s,r.id,'maker');
 assert.equal(r.version,3);assert.equal(r.name,original);assert.equal(r.published.version,1);assert.equal(r.status,'Draft');assert.ok(live(r));
 assert.equal(r.history.length,beforeEvents+2);assert.equal(r.history.find(e=>e.action==='Rejected proposal archived').version,2);
 assert.ok(r.history.find(e=>e.action==='Rejected proposal archived').changes[0].before.name==='Rejected proposed name');
 assert.throws(()=>decide(s,'rel1','checker2','unknown','Invalid decision'),/valid review decision/);
});

// Large collections must stay searchable without dropping distant records.
import {entityIndex,entityContext,filterRecords,pickerChoices,paginate,sortEntities,matchesEntity} from './dist/navigation.mjs';
test('large entity collections search the entire result before paging',()=>{
 const state=seed(),template=structuredClone(find(state,'brd1'));
 for(let n=1;n<=1200;n++)state.records.push({...structuredClone(template),id:'large-'+n,code:'BRD-L'+n,name:'Collectionitem '+String(n).padStart(4,'0')});
 const rows=filterRecords(state,{type:'brand',program:'prg1',query:'Collectionitem'});
 assert.equal(rows.length,1200);assert.equal(paginate(rows).items.length,25);
 const distant=filterRecords(state,{query:'BRD-L1200'});assert.equal(distant.length,1);assert.equal(distant[0].id,'large-1200');
 assert.equal(filterRecords(state,{type:'brand',query:'Northstar Collectionitem'}).length,1200);
 const last=paginate(rows,{page:999,pageSize:50});assert.equal(last.page,24);assert.equal(last.to,1200);
 assert.deepEqual(paginate([]).items,[]);assert.equal(paginate([]).from,0);
});
test('duplicate names retain explicit unique IDs and deterministic order',()=>{
 const state=seed(),r=structuredClone(find(state,'org1'));state.records.push({...r,id:'duplicate',code:'ORG-999'});
 const rows=pickerChoices(state,{type:'org',query:r.name});assert.equal(rows.length,2);assert.notEqual(rows[0].id,rows[1].id);
 assert.deepEqual(sortEntities(rows).map(r=>r.id),sortEntities([...rows].reverse()).map(r=>r.id));
 assert.equal(pickerChoices(state,{type:'org',query:'ORG-999'})[0].id,'duplicate');
});
test('approved parent search follows published ancestry during amendments',()=>{
 const state=seed(),program=find(state,'prg1'),original=program.name;amend(state,program.id,'maker');program.name='Proposed rename';program.refs.org='org2';
 assert.equal(pickerChoices(state,{type:'program',org:'org2',approved:true}).some(r=>r.id==='prg1'),false);
 assert.equal(pickerChoices(state,{type:'program',org:'org1',approved:true}).some(r=>r.id==='prg1'),true);
 const brand=find(state,'brd1'),index=entityIndex(state);
 assert.ok(entityContext(brand,index,{approved:true}).includes(original));
 assert.equal(matchesEntity(brand,'Proposed rename',index,{approved:true}),false);
 assert.equal(pickerChoices(state,{type:'brand',org:'org2',approved:true}).some(r=>r.id==='brd1'),false);
});
test('browse includes both active and proposed program membership without duplicates',()=>{
 const state=seed(),brand=find(state,'brd1');amend(state,brand.id,'maker');brand.refs.program='prg2';
 for(const program of ['prg1','prg2'])assert.equal(filterRecords(state,{program,type:'brand'}).filter(r=>r.id===brand.id).length,1);
 assert.equal(pickerChoices(state,{type:'brand',program:'prg2'}).some(r=>r.id===brand.id),true);
 assert.equal(pickerChoices(state,{type:'brand',program:'prg2',approved:true}).some(r=>r.id===brand.id),false);
});
test('organisation-scoped programs allow many programs and an empty organisation',()=>{
 const state=seed();assert.equal(pickerChoices(state,{type:'program',org:'org1'}).length,2);
 state.records.push({...structuredClone(find(state,'org1')),id:'empty-org',code:'ORG-EMPTY'});
 assert.equal(pickerChoices(state,{type:'program',org:'empty-org'}).length,0);
 assert.equal(pickerChoices(state,{type:'program',org:'missing'}).length,0);
});
