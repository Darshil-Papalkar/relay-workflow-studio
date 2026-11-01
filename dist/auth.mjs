import {PEOPLE} from './domain.mjs';

// Demo adapter only. Production must replace this with its identity service.
export const AUTHORITY_TYPES = Object.freeze({
 maker: {id:'maker',role:'Maker',label:'Maker',icon:'edit',description:'Create and manage partner, product and release records.',permissions:['view','create','policy','export'],enabled:['Create & edit records','Submit for approval','Configure approval routes'],restricted:'Approval decisions are made by assigned checkers.'},
 checker: {id:'checker',role:'Checker',label:'Checker',icon:'shield',description:'Review assigned requests and record approval decisions.',permissions:['view','review','export'],enabled:['Review assigned requests','Approve or request changes','Inspect dependencies & history'],restricted:'Record creation and editing are unavailable.'},
 auditor: {id:'auditor',role:'Auditor',label:'Auditor',icon:'audit',description:'Inspect records, relationships and the complete audit trail.',permissions:['view','export'],enabled:['Read all records & relationships','Inspect approval history','Export audit evidence'],restricted:'Read-only access. Records and decisions cannot be changed.'}
});
export const DEMO_ACCOUNTS = Object.freeze([
 {username:'aanya.shah',userId:'maker',authorityIds:['maker','auditor']},
 {username:'nisha.rao',userId:'checker1',authorityIds:['checker','auditor']},
 {username:'dev.mehta',userId:'checker2',authorityIds:['checker']},
 {username:'mira.kapoor',userId:'auditor',authorityIds:['auditor']},
 {username:'restricted.user',userId:'restricted',authorityIds:[]}
]);
export const DEMO_PASSWORD='Demo@123';
export const SESSION_KEY='relay-demo-session-v1';
const responseFor=account=>({
 user:{id:account.userId,username:account.username,name:PEOPLE.find(p=>p.id===account.userId)?.name||'Restricted demo user'},
 authorities:account.authorityIds.map(id=>structuredClone(AUTHORITY_TYPES[id]))
});
export function authenticateDemo(username,password){
 const account=DEMO_ACCOUNTS.find(a=>a.username===String(username).trim().toLowerCase());
 if(!account||password!==DEMO_PASSWORD)throw Error('The username or password is incorrect. Please try again.');
 return responseFor(account);
}
export function startSession(response,now=Date.now()){
 return {user:structuredClone(response.user),authorities:structuredClone(response.authorities),activeAuthorityId:null,expiresAt:now+8*60*60*1000};
}
export function activeAuthority(session){
 if(!session||session.expiresAt<=Date.now())return null;
 return session.authorities.find(a=>a.id===session.activeAuthorityId)||null;
}
export function selectAuthority(session,id){
 if(!session||session.expiresAt<=Date.now())throw Error('Your session has expired. Sign in again.');
 if(!session.authorities.some(a=>a.id===id))throw Error('This authority is not assigned to your account.');
 return {...session,activeAuthorityId:id};
}
export function allowed(session,permission){return !!activeAuthority(session)?.permissions.includes(permission);}
export function requirePermission(session,permission){
 if(!allowed(session,permission))throw Error('This action is unavailable under your selected authority.');
}
// Store only the demo identity/selection. Never persist username/password pairs or passwords.
export function serializeSession(session){return JSON.stringify({username:session.user.username,userId:session.user.id,activeAuthorityId:session.activeAuthorityId,expiresAt:session.expiresAt});}
export function restoreSession(raw,now=Date.now()){
 try{
  const saved=JSON.parse(raw);const account=DEMO_ACCOUNTS.find(a=>a.username===saved.username&&a.userId===saved.userId);
  if(!account||!Number.isFinite(saved.expiresAt)||saved.expiresAt<=now)return null;
  const result={...startSession(responseFor(account),now),expiresAt:saved.expiresAt};
  // Rebuild permissions from the current response; ignore any stored role/permission claims.
  if(saved.activeAuthorityId&&!account.authorityIds.includes(saved.activeAuthorityId))return null;
  return {...result,activeAuthorityId:saved.activeAuthorityId||null};
 }catch{return null;}
}
