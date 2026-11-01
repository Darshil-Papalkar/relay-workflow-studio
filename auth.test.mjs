import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticateDemo,startSession,selectAuthority,activeAuthority,allowed,requirePermission,serializeSession,restoreSession,DEMO_PASSWORD} from './dist/auth.mjs';
import {seed,find,canReview} from './dist/domain.mjs';
import {workBuckets,nextAction} from './dist/operations.mjs';

const login=name=>startSession(authenticateDemo(name,DEMO_PASSWORD));
test('valid credentials return identity and only its assigned authorities',()=>{
 const response=authenticateDemo(' AANYA.SHAH ',DEMO_PASSWORD);
 assert.equal(response.user.id,'maker');assert.equal(response.user.name,'Aanya Shah');
 assert.deepEqual(response.authorities.map(a=>a.id),['maker','auditor']);
 assert.equal('password' in response,false);
});
test('invalid username and password return the same actionable error',()=>{
 for(const [u,p] of [['aanya.shah','wrong'],['missing.user',DEMO_PASSWORD],['','']])assert.throws(()=>authenticateDemo(u,p),/username or password is incorrect/);
});
test('no workflow is enabled until an assigned authority is selected',()=>{
 const s=login('aanya.shah');assert.equal(activeAuthority(s),null);assert.equal(allowed(s,'view'),false);
 assert.throws(()=>requirePermission(s,'create'),/unavailable/);
 assert.throws(()=>selectAuthority(s,'checker'),/not assigned/);
 const ready=selectAuthority(s,'maker');assert.equal(allowed(ready,'create'),true);assert.equal(allowed(ready,'review'),false);
});
test('switching maker to auditor keeps identity and removes mutation permissions',()=>{
 const maker=selectAuthority(login('aanya.shah'),'maker'),auditor=selectAuthority(maker,'auditor');
 assert.deepEqual(auditor.user,maker.user);assert.equal(auditor.user.id,'maker');
 for(const capability of ['create','review','policy'])assert.throws(()=>requirePermission(auditor,capability),/unavailable/);
 assert.ok(allowed(auditor,'view'));assert.ok(allowed(auditor,'export'));
 const buckets=workBuckets(seed(),auditor.user.id,activeAuthority(auditor).role);
 assert.equal(buckets[0].id,'recent');assert.equal(nextAction(find(seed(),'rel3'),'maker','Auditor'),'Inspect record and decision history');
});
test('checker authority enables decisions while auditor does not change assignment readiness',()=>{
 const s=seed(),checker=selectAuthority(login('nisha.rao'),'checker'),auditor=selectAuthority(checker,'auditor');
 assert.equal(checker.user.id,'checker1');assert.ok(canReview(find(s,'prg3'),checker.user.id));
 assert.ok(allowed(checker,'review'));assert.equal(allowed(auditor,'review'),false);
 assert.ok(canReview(find(s,'prg3'),auditor.user.id));
 assert.equal(canReview({...find(s,'prg3'),owner:checker.user.id},checker.user.id),false);
});
test('a single authority still requires explicit confirmation',()=>{
 const s=login('dev.mehta');assert.equal(s.authorities.length,1);assert.equal(activeAuthority(s),null);
 assert.equal(selectAuthority(s,'checker').user.id,'checker2');
});
test('a valid account with zero authorities cannot enter any workflow',()=>{
 const s=login('restricted.user');assert.deepEqual(s.authorities,[]);assert.equal(allowed(s,'view'),false);
 assert.throws(()=>selectAuthority(s,'auditor'),/not assigned/);
});
test('session restoration keeps selection without storing a password or trusting persisted permissions',()=>{
 const s=selectAuthority(login('nisha.rao'),'auditor'),serialized=serializeSession(s),raw=JSON.parse(serialized);
 assert.equal(serialized.includes(DEMO_PASSWORD),false);assert.equal(serialized.includes('password'),false);
 assert.equal(raw.userId,'checker1');assert.equal(raw.activeAuthorityId,'auditor');
 raw.permissions=['create','review'];raw.authorities=[{id:'auditor',permissions:['create']}];
 const restored=restoreSession(JSON.stringify(raw));assert.equal(activeAuthority(restored).id,'auditor');assert.equal(allowed(restored,'create'),false);
 assert.equal(restoreSession(JSON.stringify({...raw,activeAuthorityId:'maker'})),null);
 assert.equal(restoreSession(JSON.stringify({...raw,userId:'maker'})),null);
 assert.equal(restoreSession('maker'),null);
});
test('expired sessions cannot enable actions and pending selection survives refresh',()=>{
 const s=login('aanya.shah');assert.equal(restoreSession(serializeSession(s)).activeAuthorityId,null);
 const expired={...selectAuthority(s,'maker'),expiresAt:Date.now()-1};
 assert.equal(activeAuthority(expired),null);assert.equal(restoreSession(serializeSession(expired)),null);
 assert.throws(()=>selectAuthority(expired,'maker'),/expired/);
});
