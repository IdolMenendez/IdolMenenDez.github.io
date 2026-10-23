import {PAGE_HASHES} from './manifest-root.mjs';
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
/** Small, verified per-level fetch cache. No full catalog is fetched by this module. */
export class LevelLoader {
 constructor(base='/'){this.base=base.replace(/\/$/,'');this.levels=new Map();this.manifests=new Map();this.inflight=new Map();this.epoch=0}
 async load(number,{signal}={}){
  if(!Number.isInteger(number)||number<1||number>10000)throw Error('关卡编号无效');
  if(this.levels.has(number))return this.levels.get(number);
  if(this.inflight.has(number))return this.inflight.get(number);
  const epoch=this.epoch;const task=this._read(number,signal,epoch).finally(()=>{if(this.inflight.get(number)===task)this.inflight.delete(number)});
  this.inflight.set(number,task);return task;
 }
 async _read(number,signal,epoch){
  const page=Math.ceil(number/100),key=String(page).padStart(3,'0');
  let manifest=this.manifests.get(key);
  if(!manifest){const response=await fetch(`${this.base}/manifest/${key}.json`,{signal});
   if(!response.ok)throw Error(`索引加载失败 ${response.status}`);
   const bytes=await response.arrayBuffer();if(await sha(bytes)!==PAGE_HASHES[key])throw Error('关卡索引校验失败');
   manifest=JSON.parse(new TextDecoder().decode(bytes));if(manifest.schemaVersion!==1||manifest.contentVersion!=='release-213-v3'||manifest.start!==(page-1)*100+1)throw Error('关卡索引版本不兼容');
   if(epoch!==this.epoch)throw Error('加载已取消');
   this.manifests.clear();this.manifests.set(key,manifest)}
  const entry=manifest.levels[number-manifest.start];if(entry?.number!==number)throw Error('关卡索引损坏');
  const response=await fetch(`${this.base}/${entry.path}`,{signal});
  if(!response.ok)throw Error(`关卡加载失败 ${response.status}`);
  const bytes=await response.arrayBuffer();if(bytes.byteLength!==entry.bytes)throw Error('关卡长度不符');
  const hash=await sha(bytes);
  if(hash!==entry.sha256)throw Error('关卡内容校验失败');
  const level=JSON.parse(new TextDecoder().decode(bytes));
  if(level.number!==number||level.id!==entry.id||(number>100&&level.contentVersion!=='release-213-v3'))throw Error('关卡身份不符');
  if(epoch!==this.epoch)throw Error('加载已取消');
  this.levels.set(number,level);
  while(this.levels.size>2)this.levels.delete(this.levels.keys().next().value);
  return level;
 }
 prefetch(number){if(number<1||number>10000)return Promise.resolve(null);return this.load(number).catch(()=>null)}
 releaseExcept(...numbers){for(const n of this.levels.keys())if(!numbers.includes(n))this.levels.delete(n)}
 clear(){this.epoch++;this.levels.clear();this.manifests.clear();this.inflight.clear()}
}
