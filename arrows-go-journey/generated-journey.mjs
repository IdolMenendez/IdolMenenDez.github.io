import {LevelLoader} from './level-loader.mjs';
import {initial,normalize,event,complete,progress,ACHIEVEMENTS} from './journey-rewards.mjs';
import {ORIGIN_ART} from './origin-art.mjs';
import {FAMILY_GLYPHS} from './family-glyphs.mjs';

const KEY='arrow-garden-journey10000-v1';
const NS='http://www.w3.org/2000/svg';
const blocker=(piece,active)=>{
  const c=piece.cells,[hx,hy]=c.at(-1),[px,py]=c.at(-2),dx=hx-px,dy=hy-py;
  return active.some(other=>other.id!==piece.id&&other.cells.some(([x,y])=>((x-hx)*dy===(y-hy)*dx)&&((x-hx)*dx+(y-hy)*dy)>0));
};
const legal=(level,history)=>{
  const done=[];
  for(const id of history){const active=level.pieces.filter(p=>!done.includes(p.id)),p=active.find(p=>p.id===id);if(!p||blocker(p,active))break;done.push(id)}
  return done;
};
function read(){try{return normalize(JSON.parse(localStorage.getItem(KEY)))}catch{return initial()}}
export function createGeneratedJourney({host,legacyReady}){
  const loader=new LevelLoader('.');let save=read(),level=null,busy=false,token=0,paused=false,mode='board',audio=null,lastError='',retryNumber=save.current,zoom=1,panX=0,panY=0,combo=0,lastRelease=0,selected=null,drag=null,frozenAt=0,boardLevel=null,flightEpoch=0;
  const pieceNodes=new Map(),flightTokens=new WeakMap();let nextFlightToken=0;
  function freezeCombo(){if(lastRelease&&!frozenAt)frozenAt=Date.now()}
  function resumeCombo(){if(frozenAt&&!paused&&!document.hidden){lastRelease+=Date.now()-frozenAt;frozenAt=0}}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)freezeCombo();else if(!paused)resumeCombo()});
  const style=document.createElement('style');
  style.textContent=`#generatedJourney{position:fixed;inset:0;z-index:200;background:#f1f8f7;color:#183b4a;font:1rem system-ui;overflow:auto}#generatedJourney[hidden],#generatedJourney [hidden]{display:none!important}#generatedJourney .gj-wrap{max-width:680px;min-height:100%;box-sizing:border-box;margin:auto;padding:calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 20px);display:flex;flex-direction:column;gap:10px}#generatedJourney header{display:flex;justify-content:space-between;align-items:center;gap:8px}#generatedJourney h1{font-size:1.5em;margin:0}#generatedJourney button,#generatedJourney input{font:inherit}#generatedJourney button{border:0;border-radius:14px;min-height:44px;padding:9px 13px;background:#fff;color:#183b4a;box-shadow:0 2px 8px #183b4a18}#generatedJourney button.primary{background:#27a995;color:white;font-weight:700;min-height:52px}#generatedJourney button:disabled{opacity:.45}#generatedJourney .gj-info{color:#55717c;font-size:.875em}#generatedJourney svg{display:block;width:min(100%,58vh);aspect-ratio:1;margin:auto;background:white;border-radius:24px;touch-action:none;box-shadow:0 6px 22px #183b4a12}#generatedJourney .gj-piece{fill:none;stroke-width:.22;stroke-linecap:round;stroke-linejoin:round;cursor:pointer}#generatedJourney .gj-hit{stroke:transparent;stroke-width:.45}#generatedJourney .gj-head-hit{fill:transparent;stroke:none}#generatedJourney .gj-actions{display:flex;gap:8px;flex-wrap:wrap}#generatedJourney .gj-status{min-height:22px}#generatedJourney .gj-error{color:#c85a56}#generatedJourney .gj-jump{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#generatedJourney input{min-width:0;width:104px;border:1px solid #a7bcc7;border-radius:10px;padding:8px}#generatedJourney .gj-card{background:white;border-radius:16px;padding:16px}#generatedJourney .gj-win{text-align:center}#generatedJourney .gj-win strong{display:block;font-size:1.375em;margin:8px}#generatedJourney .gj-page{display:grid;gap:12px}#generatedJourney .gj-range{display:flex;gap:8px;flex-wrap:wrap}#generatedJourney .gj-flight{transition:transform .22s ease,opacity .22s ease;transform:translate(var(--dx),var(--dy));opacity:0}@media(max-height:600px){#generatedJourney .gj-wrap{gap:6px;padding:8px 12px}#generatedJourney svg{width:min(100%,49vh)}#generatedJourney h1{font-size:1.25em}}@media(prefers-reduced-motion:reduce){#generatedJourney .gj-flight{transition:none}}`;
  document.head.prepend(style);
  style.textContent += `#generatedJourney #gj-board[hidden],#generatedJourney .gj-actions[hidden],#generatedJourney .gj-win[hidden]{display:none!important}#generatedJourney .gj-win{display:flex;flex-direction:column;align-items:center;gap:6px}#generatedJourney .gj-win p{margin:4px 0}#generatedJourney .gj-win #gj-next{position:sticky;bottom:calc(env(safe-area-inset-bottom) + 8px);z-index:2;width:100%;order:-1}#generatedJourney .gj-win #gj-win-info svg{width:56px!important;height:56px!important}@media(max-height:600px){#generatedJourney .gj-wrap{padding-bottom:8px}#generatedJourney .gj-card{padding:10px}#generatedJourney .gj-win #gj-next{position:fixed;bottom:calc(env(safe-area-inset-bottom) + 8px);left:12px;width:calc(100% - 24px)}#generatedJourney .gj-win{padding-bottom:60px}#generatedJourney #gj-pause-panel{gap:6px}#generatedJourney #gj-pause-panel h2,#generatedJourney #gj-pause-panel p{margin:2px 0}#generatedJourney #gj-pause-panel #gj-resume{order:-1}}`;
  style.textContent += `#generatedJourney .gj-album-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#generatedJourney .gj-album-card{min-width:0;background:#fff;border:1px solid #d6e6dd;border-radius:15px;padding:5px;display:flex;flex-direction:column;gap:4px}#generatedJourney .gj-album-card.locked{background:#eef3f2;color:#526d72}#generatedJourney .gj-card-face{display:flex;flex-direction:column;align-items:center;gap:3px;width:100%;min-height:116px;padding:4px!important;box-shadow:none!important;text-align:center;overflow-wrap:anywhere;white-space:normal}#generatedJourney .gj-card-face strong,#generatedJourney .gj-card-face small{font-size:.85em;line-height:1.3}#generatedJourney .gj-album-art{width:68px;height:68px;min-width:68px;display:grid;place-items:center;margin:auto;color:#ab792d}#generatedJourney .locked .gj-album-art{color:#667e83}#generatedJourney .gj-album-art svg{width:64px!important;height:64px!important;aspect-ratio:1!important;box-shadow:none!important;background:none!important}#generatedJourney .gj-card-action{font-size:.75em;min-height:44px;white-space:normal;overflow-wrap:anywhere}#generatedJourney #gj-album-detail .gj-album-art{width:120px;height:120px}#generatedJourney #gj-album-detail .gj-album-art svg{width:110px!important;height:110px!important}#generatedJourney button:focus-visible{outline:3px solid #184954;outline-offset:2px}@media(max-width:359px){#generatedJourney .gj-album-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:375px){#generatedJourney .gj-album-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}.text-enlarged #generatedJourney .gj-album-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#generatedJourney .gj-wrap,#generatedJourney .gj-card,#generatedJourney .gj-album-card{min-width:0}#generatedJourney .gj-jump>*{max-width:100%}#generatedJourney button{overflow-wrap:anywhere}#generatedJourney.gj-large-text .gj-album-grid{grid-template-columns:repeat(2,minmax(0,1fr))}`;
  host.innerHTML=`<div class="gj-wrap"><header><div><div class="gj-info">向量花园 · 连续旅程</div><h1 id="gj-title">载入中</h1></div><button id="gj-close">首页</button></header><div class="gj-info" id="gj-progress"></div><section id="gj-play"><svg id="gj-board" role="group" aria-label="箭头棋盘"></svg><div class="gj-status" id="gj-status" role="status" aria-live="polite"></div><div class="gj-actions"><button id="gj-undo">↶ 撤回</button><button id="gj-hint">✦ 提示</button><button id="gj-restart">↺ 重来</button><button id="gj-pause">Ⅱ 暂停</button><button id="gj-retry" hidden>重试加载</button></div><div class="gj-card gj-win" id="gj-win" hidden><strong>这一关，完成！</strong><div id="gj-win-info"></div><p id="gj-awards"></p><button id="gj-rewards-open">查看收藏与成就</button><button class="primary" id="gj-next">下一关 ↗</button></div></section><section class="gj-page gj-card" id="gj-journey" hidden><h2>旅程</h2><div id="gj-journey-info"></div><div class="gj-jump"><label for="gj-number">已解锁关卡</label><input id="gj-number" type="number" min="101" max="10000"><button id="gj-go">前往</button><button id="gj-main">返回主线</button></div><div class="gj-range" id="gj-neighbors"></div><button id="gj-collection-open">图鉴与成就</button><button id="gj-back">返回棋盘</button></section><section class="gj-page gj-card" id="gj-pause-panel" hidden><h2>已暂停</h2><button class="primary" id="gj-resume">继续</button><button id="gj-pause-restart">重来本关</button><button id="gj-sound">音效：开</button><button id="gj-motion">动效：开</button><p class="gj-info">轻点箭头。箭头前方有路才会离开；受阻时先移开挡路的箭头。</p><button id="gj-pause-journey">查看旅程</button></section><button id="gj-journey-button">旅程 · 已完成 0 关</button><button id="gj-collection-button">图鉴与成就</button><section class="gj-page gj-card" id="gj-collection" hidden><h2>收藏册 · 后续旅程</h2><div id="gj-collection-summary"></div><div id="gj-album-detail" class="gj-card" hidden></div><h3>图案族</h3><div id="gj-patterns"></div><h3>成就</h3><div id="gj-achievements"></div><h3>章节奖牌</h3><div id="gj-medals"></div><p class="gj-info" hidden></p><button id="gj-legacy-album">查看前百关收藏</button><button id="gj-collection-back">返回旅程</button></section><div class="gj-info">前百关的60图案、24成就与原存档保留在收藏册。此后的每100关点亮一枚旅程章。</div></div>`;
  const $=s=>host.querySelector(s),board=$('#gj-board');
  const controls=document.createElement('div');controls.className='gj-actions';controls.innerHTML='<button id="gj-zoom-out" aria-label="缩小棋盘">−</button><button id="gj-zoom-reset">适合屏幕</button><button id="gj-zoom-in" aria-label="放大棋盘">＋</button><span id="gj-zoom-label" class="gj-info"></span><span id="gj-combo" role="status"></span>';
  board.after(controls);
  function camera(){if(!level)return;const dense=level.pieces.length>100,base=Math.max(level.width,level.height),size=dense?base/0.8:base+4.4,span=size/zoom,x=(level.width-size-1)/2+(size-span)/2+panX,y=(level.height-size-1)/2+(size-span)/2+panY;board.setAttribute('viewBox',`${x} ${y} ${span} ${span}`);$('#gj-zoom-label').textContent=`${zoom}×`}
  function setZoom(value){const previous=zoom;zoom=Math.max(1,Math.min(8,value));if(zoom===1)panX=panY=0;else if(previous===1&&level){const p=active().find(p=>!blocker(p,active()))||active()[0];if(p){const [hx,hy]=p.cells.at(-1),size=Math.max(level.width,level.height)+4.4;panX=hx-(level.width-1)/2;panY=hy-(level.height-1)/2}}camera()}
  function status(s,isError=false){$('#gj-status').textContent=s;$('#gj-status').classList.toggle('gj-error',isError)}
  function persist(candidate){try{localStorage.setItem(KEY,JSON.stringify(candidate));save=candidate;window.dispatchEvent(new Event('generated-journey-change'));return true}catch{status('本机存档失败。请检查存储空间或浏览器权限，再点重试。当前操作尚未计入进度。',true);$('#gj-retry').hidden=false;return false}}
  function active(){return level.pieces.filter(p=>!save.history.includes(p.id))}
  function show(which){mode=which;$('#gj-play').hidden=which!=='board';$('#gj-journey').hidden=which!=='journey';$('#gj-pause-panel').hidden=which!=='pause';$('#gj-collection').hidden=which!=='collection'}
  function note(){if(!save.sound)return;try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(540,audio.currentTime);o.frequency.exponentialRampToValueAtTime(720,audio.currentTime+.08);g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.1);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.11)}catch{}}
  function render(){if(!level)return;const remain=active(),won=remain.length===0;
    board.hidden=won;board.style.display=won?'none':'';for(const actions of host.querySelectorAll('#gj-play > .gj-actions'))actions.hidden=won;
    $('#gj-title').textContent=`第 ${level.number} 关`;
    $('#gj-progress').textContent=`主线第 ${save.frontier} 关 · 剩余 ${remain.length}/${level.pieces.length} 根`;
    $('#gj-journey-button').textContent=`旅程 · 已完成 ${save.completed.length} 关`;
    if(boardLevel!==level){boardLevel=level;pieceNodes.clear();board.replaceChildren();camera();const view=board.viewBox.baseVal,x=view.x,y=view.y,size=view.width;
    const dots=document.createElementNS(NS,'g');dots.setAttribute('fill','#a7bcc7');dots.setAttribute('pointer-events','none');board.append(dots);
    for(let yy=Math.ceil(y);yy<=Math.floor(y+size);yy++)for(let xx=Math.ceil(x);xx<=Math.floor(x+size);xx++){const dot=document.createElementNS(NS,'circle');dot.setAttribute('cx',xx);dot.setAttribute('cy',yy);dot.setAttribute('r','.09');dots.append(dot)}
    for(const p of level.pieces){const g=document.createElementNS(NS,'g');g.setAttribute('class','gj-piece');g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',`箭头 ${p.id}`);g.setAttribute('stroke',['#27a995','#5e87c2','#e6a857','#a775bd'][Math.abs(Number(p.id))%4]);
      const path=p.cells.map(([a,b],i)=>`${i?'L':'M'}${a} ${b}`).join(' '),[a,b]=p.cells.at(-2),[c,d]=p.cells.at(-1),dx=c-a,dy=d-b;
      const add=(shape,klass)=>{const e=document.createElementNS(NS,'path');e.setAttribute('class',klass);e.setAttribute('d',shape);g.append(e)};
      add(path,'gj-hit');add(path,'gj-ink');add(`M${c-dx*.45-dy*.45} ${d-dy*.45+dx*.45}L${c} ${d}L${c-dx*.45+dy*.45} ${d-dy*.45-dx*.45}`,'gj-ink');
      const hit=document.createElementNS(NS,'circle');hit.setAttribute('class','gj-head-hit');hit.setAttribute('cx',c);hit.setAttribute('cy',d);hit.setAttribute('r','.48');g.append(hit);
      g.addEventListener('click',e=>{if(drag?.moved)return;const rect=board.getBoundingClientRect(),v=board.viewBox.baseVal,px=v.x+(e.clientX-rect.left)*v.width/rect.width,py=v.y+(e.clientY-rect.top)*v.height/rect.height;if(Math.hypot(c-px,d-py)>.5)return;const nearby=active().filter(q=>{const [hx,hy]=q.cells.at(-1);return Math.hypot(hx-px,hy-py)<.8});if(nearby.length>1&&selected!==p.id){selected=p.id;status(`已选箭头 ${p.id}；再点一次确认，或放大后选择。`);return}selected=null;release(p.id,g,dx,dy)});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();release(p.id,g,dx,dy)}});pieceNodes.set(p.id,g);if(remain.includes(p))board.append(g)}
    }else{camera()}
    const activeIds=new Set(remain.map(p=>p.id));for(const [id,g] of pieceNodes){if(activeIds.has(id)){flightTokens.delete(g);g.classList.remove('gj-flight');g.style.removeProperty('--dx');g.style.removeProperty('--dy');if(!g.isConnected)board.append(g)}else if(!g.classList.contains('gj-flight'))g.remove()}
    $('#gj-win').hidden=!won;$('#gj-win-info').replaceChildren();if(won){$('#gj-win strong').textContent=`第 ${level.number} 关完成`;$('#gj-win-info').append(thumbnail(level),document.createElement('span'));$('#gj-win-info span').textContent=`${level.pieces.length} 根箭头全部离场`}
    const awards=$('#gj-awards');awards.replaceChildren();for(const name of save.pending.slice(0,2)){const badge=document.createElement('span');badge.className='gj-award-badge';badge.textContent=`✦ ${name.replace(/atlas\s*0*(\d+)/i,'新图案 $1')}`;awards.append(badge)}if(!save.pending.length)awards.textContent='通关记录已保存';
    $('#gj-next').textContent=level.number===10000?'旅程已完成':`进入第 ${level.number+1} 关 ↗`;
    $('#gj-undo').disabled=busy||!save.history.length||won;$('#gj-hint').disabled=busy||won;$('#gj-restart').disabled=busy||!save.history.length;
  }
  function release(id,g,dx,dy){if(busy||paused||mode!=='board'||!level)return;const p=active().find(q=>q.id===id);if(!p)return;
    if(blocker(p,active())){if(!persist(event(save,'mistakes')))return;status('这根箭头前方受阻，先移开挡路的箭头。');g.style.filter='drop-shadow(0 0 4px #c85a56)';setTimeout(()=>g.style.filter='',450);return}
    const next={...save,history:[...save.history,id],histories:{...save.histories,[level.number]:[...save.history,id]}};const won=next.history.length===level.pieces.length;
    if(won)Object.assign(next,complete(next,level));else next.pending=[];
    if(!persist(next))return;
    note();const fly=save.motion!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches;if(fly){g.style.setProperty('--dx',`${dx*100}%`);g.style.setProperty('--dy',`${dy*100}%`);g.classList.add('gj-flight');const epoch=flightEpoch,flightLevel=level,flightToken=++nextFlightToken;flightTokens.set(g,flightToken);setTimeout(()=>{if(epoch!==flightEpoch||level!==flightLevel||host.hidden||flightTokens.get(g)!==flightToken)return;flightTokens.delete(g);if(!active().some(p=>p.id===id)){g.remove();if(won)render()}},220)}else g.remove();if(!won||!fly)render();
    combo=Date.now()-lastRelease<1600?combo+1:1;lastRelease=Date.now();$('#gj-combo').textContent=won?'':combo>1?`连击 ×${combo}`:'';status(won?'全部释放！这一关完成。':combo>1?`连击 ×${combo}！接着找下一根。`:'嗖！接着找下一根。');if(won&&level.number<10000)loader.prefetch(level.number+1);
  }
  async function load(number,replay=false){if(!Number.isInteger(number)||number<101||number>save.frontier||number>10000){status('该关尚未解锁。',true);return}
    const t=++token;retryNumber=number;busy=true;paused=false;resumeCombo();show('board');$('#gj-retry').hidden=true;status(`正在校验第 ${number} 关…`);
    try{const next=await loader.load(number);if(t!==token)return;
      if(next.schemaVersion!==1||next.geometryHash?.length!==64||!Array.isArray(next.pieces)||!next.pieces.length||!Array.isArray(next.witness)||legal(next,next.witness).length!==next.pieces.length)throw Error('关卡规则数据不完整');
      const prior=replay?[]:save.histories[number]||[];
      const candidate=save.current===number&&!replay?save:{...save,current:number,history:prior,histories:{...save.histories,[number]:prior},runs:{...save.runs,[number]:replay?{mistakes:0,hints:0,undos:0,restarts:0}:save.runs[number]||{mistakes:0,hints:0,undos:0,restarts:0}},pending:[]};
      if(legal(next,candidate.history).length!==candidate.history.length)throw Error('存档中的消除顺序无效');
      if(!persist(candidate))throw Error('无法保存当前关卡');
      flightEpoch++;level=next;zoom=1;panX=panY=0;combo=0;$('#gj-combo').textContent='';loader.releaseExcept(number,number+1);render();status('点箭头，沿方向离开');loader.prefetch(number+1);
    }catch(e){if(t!==token)return;lastError=e.message;console.error('关卡载入失败',e);paused=true;flightEpoch++;boardLevel=null;pieceNodes.clear();board.replaceChildren();$('#gj-win').hidden=true;status('关卡暂时无法载入，当前进度已保留',true);$('#gj-retry').hidden=false}
    finally{if(t===token){busy=false;if(level&&mode==='board')render()}}
  }
  function thumbnail(data,locked=false){const svg=document.createElementNS(NS,'svg'),cells=data.pieces.flatMap(p=>p.cells),xs=cells.map(c=>c[0]),ys=cells.map(c=>c[1]),minX=Math.min(...xs),minY=Math.min(...ys),size=Math.max(Math.max(...xs)-minX,Math.max(...ys)-minY)+3;svg.setAttribute('viewBox',`${minX-1.5} ${minY-1.5} ${size} ${size}`);svg.setAttribute('aria-label',locked?'未获得图案剪影':`第 ${data.number} 关箭头图案`);svg.style.cssText='width:96px;height:96px;aspect-ratio:auto;display:inline-block;vertical-align:middle;box-shadow:none;border-radius:8px';for(const p of data.pieces){const path=document.createElementNS(NS,'path');path.setAttribute('d',p.cells.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke',locked?'#b8c3c8':'#27a995');path.setAttribute('stroke-width',String(Math.max(1.8,size/28)));path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path)}return svg}
  const originById=new Map(ORIGIN_ART.map(art=>[art.id,art]));
  function familyArt(data){
    const id=/^rewrite:([a-z0-9-]+)$/.exec(data.family)?.[1],art=originById.get(id);
    if(!art||!art.artFillPath||!(art.width>0&&art.height>0))throw Error(`找不到 ${data.family||'未知家族'} 的源图案`);
    return art;
  }
  function emblem(art,locked=false){
    if(!FAMILY_GLYPHS[art.id])throw Error(`图鉴图标缺失：${art.id}`);
    const svg=document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('aria-hidden','true');
    svg.setAttribute('data-origin-id',art.id);
    svg.setAttribute('data-glyph-type','semantic');
    svg.style.color=locked?'#9aaeb0':'#27a995';
    svg.innerHTML=FAMILY_GLYPHS[art.id];
    return svg;
  }
  let collectionPage=0,medalPage=0,collectionToken=0;
  const albumIcons={
   'first-pattern':'M7 8h26v25H7zM13 17l7-7 7 7-7 7z',
   'pattern-eight':'M5 5h13v13H5zM22 5h13v13H22zM5 22h13v13H5zM22 22h13v13H22z',
   'clean-three':'M20 4l13 5v11q0 10-13 16Q7 30 7 20V9zM12 20l5 5 11-12',
   'no-hint-ten':'M12 27h16M15 32h10M20 5a10 10 0 0 1 7 17l-2 3H15l-2-3A10 10 0 0 1 20 5zM7 35L34 6',
   'families-four':'M20 4v13M20 23v13M4 20h13m6 0h13M12 12l16 16m0-16L12 28',
   'chapters-two':'M5 6h13v29H5zM22 6h13v29H22zM9 14h5m-5 6h5m12-6h5m-5 6h5'
  };
  function awardIcon(id){return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="${albumIcons[id]}" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
  function medalIcon(chapter,earned){const motif=['M11 28h18M13 24l7-13 7 13','M10 27q10-20 20 0M20 9v18','M11 12l18 16M29 12L11 28','M10 24h20M14 17h12M18 10h4'][chapter%4];return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l16 9v18l-16 9L4 29V11z" fill="none" stroke="currentColor" stroke-width="2"/><path d="${motif}" fill="none" stroke="currentColor" stroke-width="2"/><text x="20" y="24" text-anchor="middle" font-size="14" font-weight="800" fill="currentColor">${chapter}</text></svg>`}
  function albumCard(parent,title,state,icon,detail,action){const wrap=document.createElement('div');wrap.className='gj-album-card '+(state.startsWith('🔒')?'locked':'earned');const b=document.createElement('button');b.className='gj-card-face';b.setAttribute('aria-label',`${title}，${state}`);b.innerHTML=`<span class="gj-album-art">${icon}</span><strong></strong><small></small>`;b.querySelector('strong').textContent=title;b.querySelector('small').textContent=state;b.onclick=()=>{const box=$('#gj-album-detail');box.hidden=false;box.replaceChildren();const back=document.createElement('button');back.textContent='‹ 返回收藏册';back.onclick=()=>{box.hidden=true;b.focus()};const art=document.createElement('div');art.className='gj-album-art';art.replaceChildren(...Array.from(b.querySelector('.gj-album-art').childNodes, node=>node.cloneNode(true)));const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=state+' · '+detail;box.append(back,art,h,p);if(action){const play=document.createElement('button');play.textContent=action.label;play.onclick=action.click;box.append(play)}box.scrollIntoView({block:'start'});back.focus()};wrap.append(b);if(action){const play=document.createElement('button');play.className='gj-card-action';play.textContent=action.label;play.onclick=action.click;wrap.append(play)}parent.append(wrap);return wrap}
  async function collection(){freezeCombo();paused=true;show('collection');host.classList.toggle('gj-large-text',parseFloat(getComputedStyle(document.documentElement).fontSize)>24);$('#gj-title').textContent='收藏册 · 后续旅程';const t=++collectionToken,c=progress(save),panel=$('#gj-collection'),detail=$('#gj-album-detail');detail.hidden=true;$('#gj-collection-summary').textContent=`图案族 ${c.patterns} · 成就 ${Object.keys(save.awards).length}/${ACHIEVEMENTS.length} · 章节 ${c.chapters}`;const patterns=$('#gj-patterns');patterns.replaceChildren();const entries=Object.values(save.patterns),page=entries.slice(collectionPage*8,collectionPage*8+8);if(level&&!save.patterns[level.family])page.push({title:level.family,source:level.number,locked:true});const grid=document.createElement('div');grid.className='gj-album-grid';patterns.append(grid);for(const p of page){
      const state=p.locked?'🔒 未收集':'✓ 已收集';
      const action=p.locked?null:{label:`回玩第 ${p.source} 关`,click:()=>load(p.source,true)};
      const row=albumCard(grid,'源图案载入中',state,'<span class="gj-load-art">载入图案</span>',`回玩第 ${p.source} 关的源图案`,action);
      try{
        const data=level?.number===p.source?level:await loader.load(p.source);
        if(t!==collectionToken||mode!=='collection')return;
        const art=familyArt(data),name=art.title;
        const face=row.querySelector('.gj-card-face');
        face.querySelector('strong').textContent=name;
        face.setAttribute('aria-label',`${name}，${state}`);
        row.querySelector('.gj-album-art').replaceChildren(emblem(art,p.locked));
        face.onclick=()=>{
          const box=$('#gj-album-detail');box.hidden=false;box.replaceChildren();
          const back=document.createElement('button');back.textContent='‹ 返回收藏册';
          back.onclick=()=>{box.hidden=true;face.focus()};
          const icon=document.createElement('div');icon.className='gj-album-art';icon.append(emblem(art,p.locked));
          const h=document.createElement('h3');h.textContent=name;
          const desc=document.createElement('p');desc.textContent=`${state} · 这是前百关「${name}」的图案族徽记。第 ${p.source} 关的实际造型见下方箭头预览与棋盘。`;
          const preview=document.createElement('div');preview.className='gj-level-preview';
          const previewLabel=document.createElement('p');previewLabel.textContent=`第 ${p.source} 关箭头排列`;
          const arrows=thumbnail(data,p.locked);arrows.setAttribute('aria-hidden','true');
          preview.append(previewLabel,arrows);box.append(back,icon,h,desc,preview);
          if(action){const play=document.createElement('button');play.textContent=action.label;play.onclick=action.click;box.append(play)}
          box.scrollIntoView({block:'start'});back.focus();
        };
      }catch(e){
        const face=row.querySelector('.gj-card-face');
        face.querySelector('strong').textContent='源图案不可用';
        face.setAttribute('aria-label',`第 ${p.source} 关源图案不可用，${state}`);
        row.querySelector('.gj-album-art').textContent='图案加载失败';
        face.onclick=()=>{const box=$('#gj-album-detail');box.hidden=false;box.textContent=`源图案加载失败：${e.message}。请重试。`};
        const retry=document.createElement('button');retry.textContent='重试加载源图案';retry.onclick=collection;row.append(retry);
      }
    }
    if(!page.length)albumCard(grid,'第一枚图案','🔒 未收集',awardIcon('first-pattern'),'完成后续关卡即可收集');if(entries.length>8){const nav=document.createElement('div'),prev=document.createElement('button'),next=document.createElement('button');prev.textContent='上一页';next.textContent='下一页';prev.disabled=collectionPage===0;next.disabled=(collectionPage+1)*8>=entries.length;prev.onclick=()=>{collectionPage--;collection()};next.onclick=()=>{collectionPage++;collection()};nav.append(prev,document.createTextNode(` ${collectionPage+1}/${Math.ceil(entries.length/8)} `),next);patterns.append(nav)}const awards=$('#gj-achievements');awards.replaceChildren();const awardGrid=document.createElement('div');awardGrid.className='gj-album-grid';awards.append(awardGrid);for(const a of ACHIEVEMENTS){const v=c[a.kind],got=save.awards[a.id],state=got?'✓ 已获得':`🔒 ${Math.min(v,a.target)}/${a.target}`,action=got?null:{label:save.tracked===a.id?'追踪中':'追踪',click:()=>{if(persist({...save,tracked:a.id}))collection()}};albumCard(awardGrid,a.title,state,awardIcon(a.id),got?`第 ${got.level} 关获得`:`目标 ${a.target}，当前 ${v}`,action)}const medals=$('#gj-medals');medals.replaceChildren();const medalGrid=document.createElement('div');medalGrid.className='gj-album-grid';medals.append(medalGrid);const top=Math.min(99,Math.max(3,Math.ceil(save.frontier/100)));for(let i=medalPage*8+1;i<=Math.min(top,(medalPage+1)*8);i++){const done=save.completed.includes(i*100);albumCard(medalGrid,`第 ${i} 章`,done?'✓ 已获得':'🔒 未获得',medalIcon(i,done),`完成第 ${i*100} 关点亮`)}if(top>8){const nav=document.createElement('div'),prev=document.createElement('button'),next=document.createElement('button');prev.textContent='上一页';next.textContent='下一页';prev.disabled=medalPage===0;next.disabled=(medalPage+1)*8>=top;prev.onclick=()=>{medalPage--;collection()};next.onclick=()=>{medalPage++;collection()};nav.append(prev,document.createTextNode(` ${medalPage+1}/${Math.ceil(top/8)} `),next);medals.append(nav)} }

  function journey(){freezeCombo();paused=true;show('journey');$('#gj-title').textContent='后续旅程';const chapter=Math.floor((save.frontier-1)/100)+1;
    $('#gj-journey-info').innerHTML=`<strong>第 ${chapter} 章 · 主线</strong><span>${save.completed.length} / 9900 关</span><div class="gj-journey-track"><i style="width:${Math.min(100,save.completed.length/9900*100)}%"></i></div>`;$('#gj-main').textContent=`继续第 ${save.frontier} 关`;
    $('#gj-number').max=save.frontier;$('#gj-number').value=save.frontier;
    const neighbors=$('#gj-neighbors');neighbors.replaceChildren();for(let n=Math.max(101,save.frontier-2);n<=save.frontier;n++){const b=document.createElement('button');b.textContent=`第 ${n} 关${save.completed.includes(n)?' ✓':''}`;b.onclick=()=>load(n,save.completed.includes(n));neighbors.append(b)}
  }
  $('#gj-close').onclick=()=>{token++;collectionToken++;flightEpoch++;host.hidden=true;paused=false;resumeCombo();loader.clear();level=null;document.querySelector('.home-screen').hidden=false};
  $('#gj-zoom-in').onclick=()=>setZoom(zoom*2);$('#gj-zoom-out').onclick=()=>setZoom(zoom/2);$('#gj-zoom-reset').onclick=()=>setZoom(1);
  board.addEventListener('pointerdown',e=>{if(zoom===1)return;drag={x:e.clientX,y:e.clientY,moved:false};board.setPointerCapture(e.pointerId)});
  board.addEventListener('pointermove',e=>{if(!drag)return;const rect=board.getBoundingClientRect(),span=board.viewBox.baseVal.width,dx=(e.clientX-drag.x)*span/rect.width,dy=(e.clientY-drag.y)*span/rect.height;if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>2)drag.moved=true;panX-=dx;panY-=dy;drag.x=e.clientX;drag.y=e.clientY;camera()});
  board.addEventListener('pointerup',()=>{if(drag)setTimeout(()=>{drag=null},0)});
  $('#gj-undo').onclick=()=>{if(!save.history.length||paused)return;const history=save.history.slice(0,-1);if(persist({...event(save,'undos'),history,histories:{...save.histories,[save.current]:history},pending:[]})){combo=0;render();status('已撤回一步。')}};
  $('#gj-hint').onclick=()=>{const p=active().find(p=>!blocker(p,active()));if(p&&persist(event(save,'hints'))){board.querySelectorAll('.gj-piece').forEach(g=>g.style.opacity=g.getAttribute('aria-label')===`箭头 ${p.id}`?'1':'.3');status(`提示：箭头 ${p.id} 前方已经空了。`)}};
  $('#gj-restart').onclick=()=>{if(persist({...event(save,'restarts'),history:[],histories:{...save.histories,[save.current]:[]},pending:[]})){combo=0;lastRelease=0;frozenAt=0;$('#gj-combo').textContent='';render();status('本关已重新开始。')}};
  $('#gj-retry').onclick=()=>load(retryNumber);
  $('#gj-next').onclick=()=>{if(level?.number===10000){status('一万关旅程完成。');return}load(level.number+1)};
  $('#gj-journey-button').onclick=journey;$('#gj-collection-button').onclick=collection;$('#gj-collection-open').onclick=collection;$('#gj-rewards-open').onclick=collection;$('#gj-collection-back').onclick=journey;$('#gj-legacy-album').onclick=()=>{token++;loader.clear();host.hidden=true;document.querySelector('.home-screen').hidden=false;document.querySelector('#albumEntry')?.click()};$('#gj-go').onclick=()=>{const n=Number($('#gj-number').value),error=$('#gj-jump-error');if(!Number.isInteger(n)||n<101||n>save.frontier){error.textContent='请选择已解锁的关卡';return}error.textContent='';load(n,save.completed.includes(n))};$('#gj-main').onclick=()=>load(save.frontier);$('#gj-back').onclick=()=>{paused=false;resumeCombo();show('board');render()};
  $('#gj-pause').onclick=()=>{freezeCombo();paused=true;$('#gj-sound').textContent=`音效：${save.sound?'开':'关'}`;$('#gj-motion').textContent=`动效：${save.motion===false?'关':'开'}`;show('pause')};$('#gj-resume').onclick=()=>{paused=false;if(!document.hidden)resumeCombo();show('board')};$('#gj-pause-restart').onclick=()=>{if(persist({...event(save,'restarts'),history:[],histories:{...save.histories,[save.current]:[]},pending:[]})){combo=0;lastRelease=0;frozenAt=0;$('#gj-combo').textContent='';paused=false;show('board');render()}};
  $('#gj-pause-journey').onclick=journey;
  $('#gj-sound').onclick=()=>{if(persist({...save,sound:save.sound===false}))$('#gj-sound').textContent=`音效：${save.sound?'开':'关'}`};
  $('#gj-motion').onclick=()=>{if(persist({...save,motion:save.motion===false}))$('#gj-motion').textContent=`动效：${save.motion?'开':'关'}`};
  return {state:()=>({frontier:save.frontier,current:save.current,completed:save.completed.length}),hasProgress:()=>save.current>101||save.completed.length>0,open(number){if(!legacyReady()){status('先完成前百关。',true);return}host.hidden=false;load(number??save.current)},openJourney(){if(!legacyReady())return;host.hidden=false;journey()}};
}
