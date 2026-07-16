import { Client, Users, Databases, Query } from 'node-appwrite';
const endpoint=process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,projectId=process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,apiKey=process.env.APPWRITE_API_KEY;
const client=new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases=new Databases(client),users=new Users(client);
const DB='nrep_matrix_db',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ASSIGNMENTS=[
{email:'mkizza@nrep.ug',targets:['3.1.1','3.1.2','3.2.1','3.5.1']},
{email:'smuhumuza@nrep.ug',targets:['1.1.1','1.1.2','1.5.1','1.5.2','1.6.1','1.6.2','1.6.3']},
{email:'nmutesi@nrep.ug',targets:['1.3.1','1.3.2','1.4.1','1.4.2','1.4.3','1.9.1','1.9.2']},
{email:'dnatukwasa@nrep.ug',targets:['1.7.1','1.7.2','1.7.3','1.7.4','3.3.1','3.3.2','3.3.3']},
{email:'enabaho@nrep.ug',targets:['2.3.1','2.3.2','5.1.1','5.1.2']},
{email:'zgabriella@nrep.ug',targets:['1.2.1','2.2.1','2.2.2','2.2.3']},
{email:'cnamagala@nrep.ug',targets:['1.8.1','2.1.1','2.1.2','3.4.1']},
{email:'gkimuli@nrep.ug',targets:[]},
{email:'pnduhuura@nrep.ug',targets:['4.1.1','4.1.2','4.6.1','4.6.2','4.6.3']},
{email:'gnantayi@nrep.ug',targets:['4.4.1','4.4.2','4.4.3','4.5.1','4.5.2','5.3.1','5.3.2','5.3.3']},
{email:'rbukusuba@nrep.ug',targets:['4.3.1','4.3.2','4.3.3','4.3.4','5.4.1','5.4.2','5.4.3']},
{email:'ratukunda@nrep.ug',targets:['4.2.1','5.2.1','5.2.2','5.2.3','5.2.4','5.2.5','5.2.6']},
{email:'mukisanic@nrep.ug',targets:[]},{email:'dmaiku@nrep.ug',targets:[]},{email:'m.tusiime@nrep.ug',targets:[]},
];
async function main(){
console.log('Clearing all target assignments...');
const res=await databases.listDocuments(DB,'targets',[Query.limit(500)]);
let cleared=0;
for(const t of res.documents){if((t.assignedUserIds??[]).length>0){await databases.updateDocument(DB,'targets',t.$id,{assignedUserIds:[]});cleared++;await sleep(80);}}
console.log(`Cleared ${cleared} targets\n`);
const codeToId={};for(const t of res.documents)codeToId[t.code]=t.$id;
console.log('Looking up users...');
const emailToId={};
for(const p of ASSIGNMENTS){try{const l=await users.list([Query.equal('email',p.email)]);if(l.users.length){emailToId[p.email]=l.users[0].$id;console.log(`  ✓ ${p.email}`);}else console.warn(`  ⚠ Not found: ${p.email}`);}catch(e){console.warn(`  ✗ ${p.email}`);}await sleep(100);}
console.log('\nAssigning targets...');
const map={};
for(const p of ASSIGNMENTS){const uid=emailToId[p.email];if(!uid)continue;for(const c of p.targets){const id=codeToId[c];if(!id){console.warn(`  ⚠ Code not found: ${c}`);continue;}if(!map[id])map[id]=[];map[id].push(uid);}}
let done=0;
for(const[id,uids]of Object.entries(map)){await databases.updateDocument(DB,'targets',id,{assignedUserIds:uids});done++;await sleep(80);}
console.log(`\n✓ ${done} targets assigned`);
console.log('\nVerification:');
for(const p of ASSIGNMENTS){const uid=emailToId[p.email];if(!uid||!p.targets.length)continue;console.log(`  ${p.email}: ${p.targets.length} targets`);}
console.log('\nDone.');
}
main().catch(e=>{console.error(e.message);process.exit(1);});
