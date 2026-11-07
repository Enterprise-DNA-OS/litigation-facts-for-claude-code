#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table as textTable } from './lib/format.mjs';
import { page, table, writeOut } from './lib/render.mjs';

const baseReads = {
 matters:'select code,name,owner,status from matters order by code',
 chronology:'select code,occurred_on,date_precision,fact,position,owner,current_support,stale_citations,reviewed,conflicts from v_chronology where matter_id=$1 order by occurred_on nulls last,code',
 'issue-proof':'select code,issue,owner,facts,reviewed_supported,contested from v_issue_proof where matter_id=$1 order by code',
 'source-gaps':'select code,fact,current_support,stale_citations from v_chronology where matter_id=$1 and (current_support=0 or stale_citations>0) order by code',
 attention:'select code,name,owner,finding from v_attention where matter_id=$1 order by finding,code',
 compliance:'select code,rule,finding,source from v_compliance where matter_id=$1 order by rule,code',
 sources:'select code,name,locator,confidentiality,revision from sources where matter_id=$1 order by code',
 issues:'select code,name,owner from issues where matter_id=$1 order by code',
 witnesses:'select code,name,role from witnesses where matter_id=$1 order by code',
 tasks:'select code,name,owner,due_on,status,completion_note from tasks where matter_id=$1 order by due_on,code',
 contradictions:'select f.code as fact,g.code as other,c.note from contradictions c join facts f on f.id=c.fact_id join facts g on g.id=c.other_id where c.matter_id=$1 order by f.code,g.code',
 'owner-load':"select owner,count(*)::integer as findings,count(*) filter(where finding like 'overdue%')::integer as overdue from v_attention where matter_id=$1 group by owner order by overdue desc,owner",
 activity:"select sequence,entity,actor,action,after_data->>'code' as code,created_at from activity where after_data->>'matter_id'=$1::text or record_id=$1::uuid order by sequence desc limit 50",
};
const addTypes = {'add-fact':'facts','add-source':'sources','add-issue':'issues','add-witness':'witnesses','add-task':'tasks'};
export const commands=[...Object.keys(baseReads),'witness-brief','citations','weekly-review','add-matter',...Object.keys(addTypes),'revise-matter','revise-task','revise-fact','revise-source','review-fact','cite','link-issue','link-witness','contradict','complete-task','log','import','export','draft-chronology','draft-witness','help'];
const must=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k}= is required`);return o[k].trim();};
function date(s){if(!s)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`Invalid ISO date: ${s}`);return s;}
const enumValue=(s,values)=>{if(!values.includes(s))throw Error(`Expected ${values.join('|')}, received ${s}`);return s;};
function parseArgs(args){const o={},pos=[];for(const a of args){if(a.startsWith('--')){const n=a.indexOf('=');o[a.slice(2,n<0?undefined:n)]=n<0?true:a.slice(n+1);}else pos.push(a);}return {cmd:pos[0]||'help',pos:pos.slice(1),o};}
async function resolve(db,entity,ref,matter){
 const params=[ref];let where='';if(entity!=='matters'){params.push(matter);where=' and matter_id=$2';}
 let rows=await db.query(`select * from ${entity} where (lower(code)=lower($1) or id::text=$1)${where}`,params);
 if(!rows.length) rows=await db.query(`select * from ${entity} where (id::text like $1||'%' or position(lower($1) in lower(name))>0)${where}`,params);
 if(rows.length!==1)throw Error(`${entity}: ${rows.length?'ambiguous':'no match'} '${ref}'${rows.length?'\n'+rows.map(x=>`${x.code} | ${x.name} | ${x.id}`).join('\n'):''}`);return rows[0];
}
async function insert(db,t,values){const keys=Object.keys(values);return (await db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0];}
async function update(db,t,id,values){const keys=Object.keys(values);return (await db.query(`update ${t} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(values),id]))[0];}
export async function loadSheet(file,sheet){
 if(path.extname(file).toLowerCase()==='.csv')return parseCsv(fs.readFileSync(file,'utf8'));
 if(path.extname(file).toLowerCase()!=='.xlsx')throw Error('Expected .xlsx Fact Spreadsheet or UTF-8 .csv');
 const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.readFile(file);
 if(!sheet&&book.worksheets.length!==1)throw Error('Workbook has multiple sheets. Choose --sheet= with its exact name');
 const ws=sheet?book.getWorksheet(sheet):book.worksheets[0];if(!ws)throw Error('Worksheet not found');
 const val=c=>{if(c.type===ExcelJS.ValueType.Formula)throw Error('Formula cells require a values-only export');if(c.value instanceof Date)return c.value.toISOString().slice(0,10);return c.text;};
 const headers=[];ws.getRow(1).eachCell({includeEmpty:true},(c,i)=>headers[i-1]=val(c).trim());
 if(!headers.length||headers.some(x=>!x)||new Set(headers.map(x=>x.toLowerCase())).size!==headers.length)throw Error('Workbook needs unique, nonempty headers on row 1');
 const rows=[];ws.eachRow((row,n)=>{if(n===1)return;if(row.cellCount>headers.length)throw Error(`Unexpected cells on row ${n}`);const obj=Object.fromEntries(headers.map((h,i)=>[h,val(row.getCell(i+1))]));if(Object.values(obj).some(x=>x!==''))rows.push(obj);});return rows;
}
async function importFacts(db,o,m){
 const rows=await loadSheet(must(o,'file'),o.sheet);
 const map=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 const get=(r,key,...aliases)=>map[key]!==undefined?(r[map[key]]??(()=>{throw Error(`Mapped column missing: ${map[key]}`)})()):pick(r,...aliases);
 const result={inserted:0,unchanged:0,updated:0,rows:rows.length,dry_run:!!o['dry-run']};
 for(const [index,raw] of rows.entries()){
  const name=String(get(raw,'fact','Fact','Fact Text','Description','Text')).trim();if(!name)throw Error(`Row ${index+2}: missing fact text; use --map= for your headers`);
  const occurred=date(String(get(raw,'date','Date','Fact Date','Start Date')).trim());
  const explicit=String(get(raw,'id','Fact ID','ID','Id')).trim();
  const canonical=JSON.stringify(Object.fromEntries(Object.entries(raw).sort(([a],[b])=>a.localeCompare(b))));
  const external=explicit||'row:'+createHash('sha256').update(canonical).digest('hex');
  const old=(await db.query('select * from facts where matter_id=$1 and external_id=$2',[m.id,external]))[0];
  if(old&&JSON.stringify(Object.fromEntries(Object.entries(old.source_data).sort(([a],[b])=>a.localeCompare(b))))===canonical){result.unchanged++;continue;}
  if(old&&!o.update)throw Error(`Changed source row ${external}; review and repeat with --update`);
  const values={name,occurred_on:occurred,date_precision:occurred?'day':'unknown',source_data:JSON.stringify(raw)};
  if(old){await update(db,'facts',old.id,values);result.updated++;}
  else {await insert(db,'facts',{matter_id:m.id,code:'IMP-'+createHash('sha256').update(external).digest('hex').slice(0,16),external_id:external,...values});result.inserted++;}
 }
 return result;
}
const witnessQuery=`select w.code as witness,w.name,f.code,f.occurred_on,f.fact,f.current_support,f.conflicts from witnesses w left join fact_witnesses l on l.witness_id=w.id left join v_chronology f on f.id=l.fact_id where w.id=$1 order by f.occurred_on nulls last,f.code`;
const citeQuery=`select f.code as fact,s.code as source,s.name,c.pinpoint,c.stance,s.confidentiality,c.fact_revision=f.revision and c.source_revision=s.revision as current from citations c join facts f on f.id=c.fact_id join sources s on s.id=c.source_id where c.matter_id=$1 order by f.code,s.code,c.pinpoint`;
export async function execute(db,args){
 const {cmd,o,pos}=parseArgs(args);if(!commands.includes(cmd))throw Error(`Unknown command ${cmd}. Run help`);
 if(cmd==='help')return {commands,usage:'facts <command> --matter=CODE --json. Writes require --actor=NAME. Use --ref=CODE for records; see CLAUDE.md.'};
 if(cmd==='matters')return db.query(baseReads.matters);
 const m=cmd==='add-matter'?null:await resolve(db,'matters',must(o,'matter'));
 if(baseReads[cmd])return db.query(baseReads[cmd],[m.id]);
 if(cmd==='citations')return db.query(citeQuery,[m.id]);
 if(cmd==='witness-brief'){const w=await resolve(db,'witnesses',must(o,'ref'),m.id);return db.query(witnessQuery,[w.id]);}
 if(cmd==='weekly-review')return {chronology:await db.query(baseReads.chronology,[m.id]),attention:await db.query(baseReads.attention,[m.id]),issues:await db.query(baseReads['issue-proof'],[m.id]),workload:await db.query(baseReads['owner-load'],[m.id])};
 if(cmd==='export'){
  const entities=['facts','sources','issues','witnesses','citations','fact_issues','fact_witnesses','contradictions','tasks'];const records={matters:[m]};
  for(const e of entities)records[e]=await db.query(`select * from ${e} where matter_id=$1 order by id`,[m.id]);
  records.activity=await db.query("select * from activity where after_data->>'matter_id'=$1::text or record_id=$1::uuid order by sequence",[m.id]);
  const folder=path.resolve(o.out||path.join(REPO_ROOT,'exports'));fs.mkdirSync(folder,{recursive:true,mode:0o700});const file=path.join(folder,`${m.code}-${randomUUID()}.json`);fs.writeFileSync(file,JSON.stringify({format:1,exported_at:new Date().toISOString(),records},null,2),{mode:0o600});return {file,counts:Object.fromEntries(Object.entries(records).map(([k,v])=>[k,v.length]))};
 }
 if(cmd.startsWith('draft-')){
  const rows=cmd==='draft-chronology'?await db.query(baseReads.chronology,[m.id]):await db.query(witnessQuery,[(await resolve(db,'witnesses',must(o,'ref'),m.id)).id]);
  const cites=await db.query(citeQuery,[m.id]);
  const file=writeOut('drafts',`${m.code}-${cmd}-${randomUUID()}`,page({title:cmd==='draft-chronology'?'Draft chronology':'Draft witness brief',subtitle:`${m.name}. INTERNAL REVIEW. Allegations and disputed accounts require lawyer review.`,sections:[{title:'Recorded facts',html:table(rows)},{title:'Evidence references',html:table(cites),note:'May contain confidential and privileged material. Review before any disclosure.'}]}));return {file,rows:rows.length};
 }
 const actor=must(o,'actor');await db.exec('BEGIN');
 try{
  await db.query("select set_config('app.actor',$1,true)",[actor]);let result;
  if(cmd==='add-matter')result=await insert(db,'matters',{code:must(o,'code'),name:must(o,'name'),owner:o.owner||'',purpose:o.purpose||'',retention_review_on:date(o['retention-review']),access_review_on:date(o['access-review'])});
  else if(addTypes[cmd]){
   const values={matter_id:m.id,code:must(o,'code'),name:must(o,'name')};
   if(cmd==='add-fact')Object.assign(values,{occurred_on:date(o.date),date_precision:o.date?enumValue(o.precision||'day',['day','month','year']):'unknown',owner:o.owner||'',review_due:date(o.due),position:enumValue(o.position||'alleged',['alleged','agreed','disputed'])});
   if(cmd==='add-source')Object.assign(values,{locator:o.locator||'',confidentiality:enumValue(o.confidentiality||'unreviewed',['unreviewed','ordinary','confidential','privileged'])});
   if(cmd==='add-issue')values.owner=o.owner||'';
   if(cmd==='add-witness')values.role=o.role||'';
   if(cmd==='add-task')Object.assign(values,{owner:must(o,'owner'),due_on:date(must(o,'due'))});
   result=await insert(db,addTypes[cmd],values);
  } else if(cmd==='import'){
   if(pos[0]!=='casefleet')throw Error('Use import casefleet');result=await importFacts(db,o,m);
   }else if(cmd==='revise-matter'||cmd==='revise-task'){
   const entity=cmd==='revise-matter'?'matters':'tasks';const record=entity==='matters'?m:await resolve(db,'tasks',must(o,'ref'),m.id);const values={};
   for(const k of (entity==='matters'?['name','owner','purpose','status']:['name','owner']))if(o[k]!==undefined)values[k]=must(o,k);
   if(o.status)enumValue(o.status,['open','closed']);
   for(const [arg,col] of (entity==='matters'?[['retention-review','retention_review_on'],['access-review','access_review_on']]:[['due','due_on']]))if(o[arg]!==undefined)values[col]=date(must(o,arg));
   if(!Object.keys(values).length)throw Error('Provide a field to revise');result=await update(db,entity,record.id,values);
  }else if(cmd==='revise-fact'||cmd==='revise-source'){
   const entity=cmd==='revise-fact'?'facts':'sources';const record=await resolve(db,entity,must(o,'ref'),m.id);const values={};
   for(const k of (entity==='facts'?['name','owner','position']:['name','locator','confidentiality']))if(o[k]!==undefined)values[k]=must(o,k);
   if(o.position)enumValue(o.position,['alleged','agreed','disputed']);if(o.confidentiality)enumValue(o.confidentiality,['unreviewed','ordinary','confidential','privileged']);
   if(o.date!==undefined){values.occurred_on=date(o.date);values.date_precision=o.date?enumValue(o.precision||'day',['day','month','year']):'unknown';}
   if(o.due!==undefined)values.review_due=date(o.due);
   if(!Object.keys(values).length)throw Error('Provide a field to revise');result=await update(db,entity,record.id,values);
  }else if(cmd==='review-fact'){
   const f=await resolve(db,'facts',must(o,'ref'),m.id);must(o,'note');
   const v=(await db.query('select * from v_chronology where id=$1',[f.id]))[0];
   if(!v.current_support||v.stale_citations)throw Error('Review needs current supporting evidence and no stale citations');
   result=await update(db,'facts',f.id,{reviewed_revision:f.revision,reviewed_by:actor,review_note:o.note});
  }else if(cmd==='cite'){
   const f=await resolve(db,'facts',must(o,'fact'),m.id),s=await resolve(db,'sources',must(o,'source'),m.id);
   result=(await db.query(`insert into citations(matter_id,fact_id,source_id,pinpoint,stance,source_revision,fact_revision) values($1,$2,$3,$4,$5,$6,$7) on conflict(fact_id,source_id,pinpoint,stance) do update set source_revision=excluded.source_revision,fact_revision=excluded.fact_revision returning *`,[m.id,f.id,s.id,must(o,'pinpoint'),enumValue(o.stance||'supports',['supports','disputes']),s.revision,f.revision]))[0];
  }else if(cmd==='link-issue'||cmd==='link-witness'){
   const e=cmd==='link-issue'?'issues':'witnesses',col=cmd==='link-issue'?'issue_id':'witness_id',t=cmd==='link-issue'?'fact_issues':'fact_witnesses';
   const f=await resolve(db,'facts',must(o,'fact'),m.id),other=await resolve(db,e,must(o,'ref'),m.id);
   result=await db.query(`insert into ${t}(matter_id,fact_id,${col}) values($1,$2,$3) on conflict do nothing returning *`,[m.id,f.id,other.id]);
  }else if(cmd==='contradict'){
   const f=await resolve(db,'facts',must(o,'fact'),m.id),g=await resolve(db,'facts',must(o,'other'),m.id);const ids=[f.id,g.id].sort();
   result=await insert(db,'contradictions',{matter_id:m.id,fact_id:ids[0],other_id:ids[1],note:must(o,'note')});
  }else if(cmd==='complete-task'){
   const t=await resolve(db,'tasks',must(o,'ref'),m.id);result=await update(db,'tasks',t.id,{status:'done',completion_note:must(o,'note')});
  }else if(cmd==='log')result=await insert(db,'activity',{entity:'matters',record_id:m.id,actor,action:'NOTE',after_data:JSON.stringify({matter_id:m.id,note:must(o,'note')})});
  await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function format(result){
 if(Array.isArray(result)){if(!result.length)return '(none)';return textTable(result,Object.keys(result[0]).map(key=>({key,label:key,width:key==='fact'||key==='name'?55:undefined,format:v=>v instanceof Date?v.toISOString():typeof v==='object'&&v!==null?JSON.stringify(v):v})));}
 if(result&&typeof result==='object'&&Object.values(result).every(Array.isArray))return Object.entries(result).map(([k,v])=>k.toUpperCase()+'\n'+format(v)).join('\n\n');
 return JSON.stringify(result,null,2);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result):format(result));}catch(e){if(process.argv.includes('--json'))console.error(JSON.stringify({error:e.message}));else console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
