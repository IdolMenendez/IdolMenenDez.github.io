export const VERSION=5;
export const FAMILY_GOAL=8;
export const ACHIEVEMENTS=[
  {id:'first-pattern',title:'初见新图',target:1,kind:'patterns'},
  {id:'pattern-eight',title:'八种构型',target:8,kind:'patterns'},
  {id:'clean-three',title:'沉着三局',target:3,kind:'clean'},
  {id:'no-hint-ten',title:'独立解题',target:10,kind:'noHint'},
  {id:'families-four',title:'结构探险',target:4,kind:'families'},
  {id:'chapters-two',title:'双章旅程',target:2,kind:'chapters'}
];
export const initial=()=>({version:VERSION,frontier:101,current:101,history:[],histories:{},completed:[],sound:true,motion:true,runs:{},records:{},patterns:{},awards:{},tracked:'first-pattern',pending:[]});
const unique=a=>[...new Set(a)];
export function normalize(raw){
  // Generated 101+ content was an unpublished candidate. Its completion order,
  // partial histories and rewards cannot be carried onto different geometry.
  if(!raw||raw.version!==VERSION)return initial();
  const s={...initial(),...raw};
  if(!Number.isInteger(s.frontier)||s.frontier<101||s.frontier>10000||!Number.isInteger(s.current)||s.current<101||s.current>s.frontier||!Array.isArray(s.history)||!Array.isArray(s.completed))return initial();
  s.completed=unique(s.completed.filter(n=>Number.isInteger(n)&&n>=101&&n<=s.frontier));
  s.runs=s.runs&&typeof s.runs==='object'?s.runs:{};
  s.records=s.records&&typeof s.records==='object'?s.records:{};
  s.patterns=s.patterns&&typeof s.patterns==='object'?s.patterns:{};
  s.awards=s.awards&&typeof s.awards==='object'?s.awards:{};
  s.pending=Array.isArray(s.pending)?s.pending:[];
  s.histories=s.histories&&typeof s.histories==='object'&&!Array.isArray(s.histories)?s.histories:{};
  s.version=VERSION;return s;
}
export function patternFor(level){return {id:level.family,source:level.number,title:level.family.replace(/^rewrite:/,'').replaceAll('-',' ')} }
export function progress(s){
  const records=Object.values(s.records),patterns=Object.keys(s.patterns),families=unique(records.map(r=>r.family));
  return {patterns:patterns.length,clean:records.filter(r=>r.mistakes===0&&r.hints===0&&r.undos===0&&r.restarts===0).length,noHint:records.filter(r=>r.hints===0).length,families:families.length,chapters:s.completed.filter(n=>n%100===0).length};
}
export function event(s,kind){const r=s.runs[s.current]||{mistakes:0,hints:0,undos:0,restarts:0};return {...s,runs:{...s.runs,[s.current]:{...r,[kind]:(r[kind]||0)+1}}}}
export function complete(s,level){
  const n=level.number,first=!s.completed.includes(n),run=s.runs[n]||{mistakes:0,hints:0,undos:0,restarts:0};
  const p=patternFor(level),newPattern=!s.patterns[p.id],newRecord=!s.records[n];
  const next={...s,completed:first?[...s.completed,n]:s.completed,frontier:n===s.frontier&&n<10000?n+1:s.frontier,
    records:newRecord?{...s.records,[n]:{...run,family:p.id,geometryHash:level.geometryHash||null,contentVersion:level.contentVersion||null,at:new Date().toISOString()}}:s.records,
    patterns:newPattern?{...s.patterns,[p.id]:{...p,at:new Date().toISOString()}}:s.patterns};
  const rewards=[];if(newPattern)rewards.push(`新图鉴：${p.title}`);if(first&&n%100===0)rewards.push(`第 ${n/100} 章奖牌`);
  const counts=progress(next),awards={...s.awards};
  for(const a of ACHIEVEMENTS)if(!awards[a.id]&&counts[a.kind]>=a.target){awards[a.id]={at:new Date().toISOString(),level:n};rewards.push(`成就：${a.title}`)}
  next.awards=awards;next.pending=rewards;return next;
}
