(function(){
"use strict";
  // ===== 学科与配色 =====
  // ===== 从外部数据加载（dist/data.js 由 scripts/build_bundle.py 生成）=====
  const DATA=window.KID_DATA;
  if(!DATA){document.getElementById('nCount').textContent='数据未加载';throw new Error('KID_DATA 缺失：请先运行 python3 scripts/build_bundle.py');}
  const GROUPS=DATA.subjects.map(s=>s.name);
  const GCOL=DATA.subjects.map(s=>s.color);
  const GRADE_MIN=DATA.gradeMin,GRADE_MAX=DATA.gradeMax,H=1400.0;
  // 学科 key -> 序号
  const subjIdx={};DATA.subjects.forEach((s,i)=>subjIdx[s.key]=i);
  // 由依赖边重建每个概念的前置列表
  const preOf={};DATA.dependencies.forEach(d=>{(preOf[d.topicId]=preOf[d.topicId]||[]).push(d.prerequisiteId);});
  const DEFS=DATA.concepts.map(c=>({k:c.id,g:subjIdx[c.subject],a:c.grade,dm:c.domain,t:c.title,q:c.question,pre:preOf[c.id]}));

  // ===== 计算布局与图结构 =====
  // 键 -> 索引
  const keyIdx={};
  DEFS.forEach((d,i)=>{keyIdx[d.k]=i;});

  // 构建 nodes 数组（与原引擎结构一致：x,y,z,g,a,c,col,dm,t,q,py,appear）
  const N=DEFS.map(d=>({x:0,y:0,z:0,g:d.g,a:d.a,c:0,col:GCOL[d.g],dm:d.dm,t:d.t,q:d.q,py:0,appear:0}));

  // 锥形布局：每个学科占据一个扇区，半径随年龄增大
  let seed=987654321;
  function rnd(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
  const sector=(2*Math.PI)/GROUPS.length;
  // 每个学科内的节点序号，用于扇区内分布
  const gSeq={}; GROUPS.forEach((_,i)=>gSeq[i]=0);
  DEFS.forEach((d,i)=>{
    const baseA=d.g*sector;
    const seq=gSeq[d.g]++;
    const ageFrac=(d.a-GRADE_MIN)/(GRADE_MAX-GRADE_MIN);
    N[i].y=ageFrac*H;
    const r=(d.a-GRADE_MIN+2)*46+rnd()*22;
    const spread=sector*0.62;
    const ang=baseA-spread/2+(seq/Math.max(1,9))*spread+(rnd()-0.5)*0.05;
    N[i].x=Math.cos(ang)*r;
    N[i].z=Math.sin(ang)*r;
  });

  // 构建 edges：[依赖项, 前置项, 类型(1=强,0=弱)]
  const E=[];
  const deg=new Array(N.length).fill(0);
  DEFS.forEach((d,i)=>{
    (d.pre||[]).forEach(pk=>{
      const j=keyIdx[pk];
      if(j!==undefined){ E.push([i,j,1]); deg[i]++; deg[j]++; }
    });
  });

  // 中心度：归一化到与原数据相近的小范围
  const maxDeg=Math.max(1,...deg);
  N.forEach((n,i)=>{n.c=(deg[i]/maxDeg)*0.85+0.02;});

  // 颜色微调（同学科内略有明暗变化，增加层次）
  function hex2rgb(h){const v=parseInt(h.slice(1),16);return[(v>>16)&255,(v>>8)&255,v&255];}
  function rgb2hex(r){return "#"+r.map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,"0")).join("");}
  N.forEach((n,i)=>{
    const b=hex2rgb(GCOL[n.g]);
    const v=0.82+rnd()*0.36;
    n.col=rgb2hex([b[0]*v,b[1]*v,b[2]*v]);
  });

  document.getElementById("nCount").textContent=N.length;
  document.getElementById("eCount").textContent=E.length;
  const reduce=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  const MID=String.fromCharCode(183);
  const gradeLabel=g=>g===0?"学前":g+"年级";

  // 居中世界坐标（y 轴向上）
  N.forEach(n=>{n.py=n.y-H/2;});

  // 前置邻接表
  const incident=Array.from({length:N.length},()=>[]);
  const directPre=Array.from({length:N.length},()=>[]);
  const directNext=Array.from({length:N.length},()=>[]);
  E.forEach((e,i)=>{incident[e[0]].push(i);incident[e[1]].push(i);directPre[e[0]].push(e[1]);directNext[e[1]].push(e[0]);});

  // 生长动画按高度
  N.forEach(n=>{n.appear=n.y/H;});

  const wrap=document.getElementById("wrap");
  const cv=document.getElementById("cv");
  const ctx=cv.getContext("2d");
  let DPR=1,VW=0,VH=0;
  const stage=document.getElementById("stage");
  function resize(){
    DPR=Math.min(window.devicePixelRatio||1,2);
    VW=stage.clientWidth; VH=stage.clientHeight;
    cv.width=VW*DPR; cv.height=VH*DPR; cv.style.width=VW+"px"; cv.style.height=VH+"px";
  }

  // ---- 相机 ----
  let rotY=0.6, tilt=-0.32, zoom=1, spin=reduce?0:0.00018;
  let panX=0,panY=0,panXT=null,panYT=null,panning=false;
  const FOV=1400;
  let grow=reduce?1:0;

  const P=new Float32Array(N.length*3);
  function project(){
    const cy=Math.cos(rotY),sy=Math.sin(rotY);
    const ct=Math.cos(tilt),st=Math.sin(tilt);
    const cx=VW*(VW<720?0.5:0.52),cyy=VH*0.52;
    const sc=Math.min(VW/1500,VH/1780)*zoom;
    for(let i=0;i<N.length;i++){
      const n=N[i];
      let x=n.x*cy+n.z*sy, z=-n.x*sy+n.z*cy, y=n.py;
      let y2=y*ct-z*st, z2=y*st+z*ct;
      const pf=FOV/(FOV+z2*sc*1.6);
      P[i*3]=cx+panX+x*sc*pf;
      P[i*3+1]=cyy+panY-y2*sc*pf;
      P[i*3+2]=pf;
    }
  }

  // ---- 状态 ----
  const active=new Set(GROUPS.map((_,i)=>i));
  let hover=-1, selected=-1, lineage=null;

  function buildLineage(i){
    const nodes=new Set([i]), edges=new Set(), q=[i];
    while(q.length){
      const u=q.shift();
      for(const idx of incident[u]){
        const e=E[idx];
        if(e[0]===u){ edges.add(idx); if(!nodes.has(e[1])){nodes.add(e[1]);q.push(e[1]);} }
      }
    }
    lineage={nodes,edges};
  }
  // ---- 交互 ----
  let dragging=false,moved=false,lx=0,ly=0;
  stage.addEventListener("pointerdown",e=>{
    if(e.button===2){panning=true;panXT=null;panYT=null;}
    else dragging=true;
    moved=false;lx=e.clientX;ly=e.clientY;
    stage.classList.add("drag"); stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("contextmenu",e=>e.preventDefault());
  stage.addEventListener("pointermove",e=>{
    if(panning){
      const dx=e.clientX-lx,dy=e.clientY-ly;
      if(Math.abs(dx)+Math.abs(dy)>3)moved=true;
      panX=Math.max(-VW*0.6,Math.min(VW*0.6,panX+dx));
      panY=Math.max(-VH*0.6,Math.min(VH*0.6,panY+dy));
      lx=e.clientX; ly=e.clientY;
    } else if(dragging){
      const dx=e.clientX-lx,dy=e.clientY-ly;
      if(Math.abs(dx)+Math.abs(dy)>3)moved=true;
      rotY+=dx*0.0055; tilt=Math.max(-1.1,Math.min(0.15,tilt-dy*0.003));
      lx=e.clientX; ly=e.clientY;
    } else onHover(e);
  });
  stage.addEventListener("pointerup",e=>{
    const wasPan=panning;
    dragging=false; panning=false; stage.classList.remove("drag");
    if(!moved && !wasPan && e.button===0) onClick(e);
  });
  stage.addEventListener("dblclick",e=>{
    const r=cv.getBoundingClientRect();
    if(pick(e.clientX-r.left,e.clientY-r.top)<0){
      panXT=0;panYT=0;zoomTarget=1;tiltTarget=-0.32;
    }
  });
  stage.addEventListener("pointerleave",()=>{hideTip();hover=-1;});
  stage.addEventListener("pointercancel",e=>{dragging=false;panning=false;stage.classList.remove("drag");pts.delete(e.pointerId);if(pts.size<2)pinchD=0;});
  stage.addEventListener("wheel",e=>{
    e.preventDefault();
    zoom=Math.max(.5,Math.min(4,zoom*Math.exp(-e.deltaY*0.0016)));
  },{passive:false});
  let pts=new Map(),pinchD=0;
  stage.addEventListener("pointerdown",e=>pts.set(e.pointerId,[e.clientX,e.clientY]));
  stage.addEventListener("pointermove",e=>{
    if(pts.has(e.pointerId))pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2){
      const[a,b]=[...pts.values()];const dd=Math.hypot(a[0]-b[0],a[1]-b[1]);
      if(pinchD)zoom=Math.max(.5,Math.min(4,zoom*dd/pinchD));
      pinchD=dd;dragging=false;
    }
  });
  stage.addEventListener("pointerup",e=>{pts.delete(e.pointerId);if(pts.size<2)pinchD=0;});

  function nodeR(i){
    return (2.3+Math.sqrt(N[i].c)*7.5)*P[i*3+2]*Math.min(1.6,Math.max(.9,zoom));
  }
  function pick(mx,my){
    let best=-1,bd=20*20;
    for(let i=0;i<N.length;i++){
      if(!active.has(N[i].g))continue;
      const dx=P[i*3]-mx,dy=P[i*3+1]-my,d=dx*dx+dy*dy;
      const rr=Math.max(11,nodeR(i)+6);
      if(d<rr*rr&&d<bd){bd=d;best=i;}
    }
    return best;
  }
  function onHover(e){
    const r=cv.getBoundingClientRect();
    const i=pick(e.clientX-r.left,e.clientY-r.top);
    if(i!==hover){hover=i;i>=0?showTip(i,e):hideTip();}
    else if(i>=0)placeTip(e);
    spin=(hover>=0||selected>=0||reduce)?0:0.00018;
  }
  // ---- 选中 + 前置链路浏览器 ----
  const hist=[];
  let rotYTarget=null,tiltTarget=null,zoomTarget=null;

  function focusNode(i){
    const n=N[i];
    let best=null,bestZ=Infinity;
    for(const cand of [Math.atan2(-n.x,n.z),Math.atan2(-n.x,n.z)+Math.PI]){
      const z2=-n.x*Math.sin(cand)+n.z*Math.cos(cand);
      if(z2<bestZ){bestZ=z2;best=cand;}
    }
    rotYTarget=best; tiltTarget=-0.18; zoomTarget=Math.max(zoom,1.15); panXT=0; panYT=0;
  }
  function onClick(e){
    const r=cv.getBoundingClientRect();
    const i=pick(e.clientX-r.left,e.clientY-r.top);
    if(i<0){clearSel();return;}
    selectNode(i,true);
  }
  function selectNode(i,push){
    if(push && selected>=0 && selected!==i) hist.push(selected);
    selected=i; buildLineage(i); showCard(i); focusNode(i); spin=0;
    hideTip();
  }
  function goBack(){
    if(!hist.length) return;
    selectNode(hist.pop(),false);
  }
  function clearSel(){
    selected=-1;lineage=null;hist.length=0;
    rotYTarget=null;tiltTarget=null;zoomTarget=null;
    document.getElementById("card").classList.remove("on");
    if(!reduce)spin=0.00018;
  }

  // ---- tooltip / 卡片 ----
  const tip=document.getElementById("tip");
  function esc(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML;}
  function showTip(i,e){
    const n=N[i];
    tip.querySelector(".sw").style.background=n.col;
    tip.querySelector(".ts").textContent=n.dm+" "+MID+" "+gradeLabel(n.a);
    tip.querySelector(".ttl").textContent=n.t;
    tip.querySelector(".q").innerHTML=n.q?esc(n.q):"";
    tip.classList.add("on");placeTip(e);
  }
  function placeTip(e){
    const r=wrap.getBoundingClientRect();
    let x=e.clientX-r.left+16,y=e.clientY-r.top+16;
    const w=tip.offsetWidth,h=tip.offsetHeight;
    if(x+w>VW-8)x=e.clientX-r.left-w-16;
    if(y+h>VH-8)y=e.clientY-r.top-h-16;
    tip.style.left=x+"px";tip.style.top=y+"px";
  }
  function hideTip(){tip.classList.remove("on");}

  const card=document.getElementById("card");
  ["pointerdown","pointerup","click","wheel"].forEach(ev=>{
    card.addEventListener(ev,e=>e.stopPropagation());
    document.getElementById("legend").addEventListener(ev,e=>e.stopPropagation());
  });
  card.querySelector(".close").addEventListener("click",clearSel);
  card.querySelector(".back").addEventListener("click",goBack);
  function fillRows(container,idxs){
    container.innerHTML="";
    if(!idxs.length){
      const d=document.createElement("div");d.className="empty";d.textContent="暂无";container.appendChild(d);return;
    }
    idxs.slice().sort((a,b)=>N[a].a-N[b].a).forEach(j=>{
      const m=N[j],b=document.createElement("button");b.className="row";
      b.innerHTML='<span class="rdot" style="background:'+m.col+'"></span>'+
        '<span class="rt">'+esc(m.t)+'</span><span class="ra mono">'+gradeLabel(m.a)+'</span>';
      b.addEventListener("click",()=>selectNode(j,true));
      container.appendChild(b);
    });
  }
  function showCard(i){
    const n=N[i],cnt=lineage.nodes.size-1;
    card.querySelector(".sw").style.background=n.col;
    card.querySelector(".cs").textContent=n.dm+" "+MID+" "+gradeLabel(n.a);
    card.querySelector(".ctl").textContent=n.t;
    card.querySelector(".cq").innerHTML=n.q?esc(n.q):"";
    card.querySelector(".n").textContent=cnt;
    card.querySelector(".u").textContent=cnt===1?"个前置知识":"个前置知识";
    card.querySelector(".sub").textContent=cnt>0
      ?"学会这个之前需要掌握的全部基础，一路追溯到底。"
      :"这是一个起点，之前不需要先学别的。";
    const pre=directPre[i],nxt=directNext[i];
    card.querySelector(".sec-pre .k").textContent=pre.length?pre.length:"";
    card.querySelector(".sec-next .k").textContent=nxt.length?nxt.length:"";
    fillRows(card.querySelector(".rows-pre"),pre);
    fillRows(card.querySelector(".rows-next"),nxt);
    card.querySelector(".back").classList.toggle("on",hist.length>0);
    card.scrollTop=0;
    card.classList.add("on");
  }
  // ---- 图例 ----
  const chips=document.getElementById("chips");
  const counts=GROUPS.map(()=>0);N.forEach(n=>counts[n.g]++);
  GROUPS.forEach((s,i)=>{
    const el=document.createElement("div");el.className="chip";el.tabIndex=0;
    el.setAttribute("role","button");el.setAttribute("aria-pressed","true");
    el.innerHTML='<span class="sw" style="background:'+GCOL[i]+'"></span>'+
      '<span class="nm">'+esc(s)+'</span><span class="ct mono">'+counts[i]+'</span>';
    const toggle=()=>{
      if(active.has(i)){active.delete(i);el.classList.add("off");el.setAttribute("aria-pressed","false");}
      else{active.add(i);el.classList.remove("off");el.setAttribute("aria-pressed","true");}
    };
    el.addEventListener("click",toggle);
    el.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();toggle();}});
    chips.appendChild(el);
  });

  function hex2rgbN(h){const n=parseInt(h.slice(1),16);return(n>>16)+","+((n>>8)&255)+","+(n&255);}
  const RGB=N.map(n=>hex2rgbN(n.col));
  const order=N.map((_,i)=>i);

  function draw(){
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,VW,VH);
    project();
    const hasSel=!!lineage;

    // ---- 边（在圆点之后绘制） ----
    for(let k=0;k<E.length;k++){
      const e=E[k],a=e[0],b=e[1];
      if(!active.has(N[a].g)||!active.has(N[b].g))continue;
      if(!reduce&&(N[a].appear>grow||N[b].appear>grow))continue;
      let alpha,col=null,lw=1;
      if(hasSel){
        if(lineage.edges.has(k)){alpha=.75;col=RGB[b];lw=1.6;}
        else{alpha=.04;}
      } else {
        alpha=e[2]?.10:.05;
      }
      const depth=(P[a*3+2]+P[b*3+2])/2;
      ctx.strokeStyle=col?"rgba("+col+","+alpha+")":"rgba(150,165,205,"+(alpha*depth)+")";
      ctx.lineWidth=lw;
      ctx.beginPath();
      ctx.moveTo(P[a*3],P[a*3+1]);ctx.lineTo(P[b*3],P[b*3+1]);
      ctx.stroke();
    }

    // ---- 圆点，远到近 ----
    order.sort((a,b)=>P[a*3+2]-P[b*3+2]);
    for(const i of order){
      const n=N[i];
      if(!active.has(n.g))continue;
      if(!reduce&&n.appear>grow)continue;
      const inLin=hasSel?lineage.nodes.has(i):true;
      const isFocus=(i===selected)||(i===hover);
      let dim=1;
      if(hasSel&&!inLin)dim=0.10;
      const sx=P[i*3],sy=P[i*3+1],pf=P[i*3+2];
      const r=nodeR(i)*(isFocus?1.6:1);
      const rgb=RGB[i];
      const a=dim*(0.55+0.45*Math.min(1,pf*pf));
      if(isFocus||(hasSel&&inLin)){
        ctx.shadowColor="rgb("+rgb+")";ctx.shadowBlur=isFocus?18:9;
      } else ctx.shadowBlur=0;
      ctx.fillStyle="rgba("+rgb+","+a+")";
      ctx.beginPath();ctx.arc(sx,sy,r,0,6.2832);ctx.fill();
      ctx.shadowBlur=0;
      ctx.strokeStyle="rgba(8,10,18,"+(0.5*dim)+")";
      ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(sx,sy,r,0,6.2832);ctx.stroke();
      if(isFocus){
        ctx.strokeStyle="rgba(255,255,255,.95)";ctx.lineWidth=1.6;
        ctx.beginPath();ctx.arc(sx,sy,r+2.5,0,6.2832);ctx.stroke();
      }
    }
  }
  // 锚定到挂钟时间，对后台标签页的 rAF 节流更稳健
  const START=performance.now();
  let lastTs=START;
  function frame(ts){
    if(!reduce) grow=Math.min(1.02,(ts-START)/2800*1.02);
    const dt=Math.min(64,ts-lastTs); lastTs=ts;
    rotY+=spin*dt;
    if(rotYTarget!==null){
      let d=((rotYTarget-rotY+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
      rotY+=d*0.12;
      if(Math.abs(d)<0.008)rotYTarget=null;
    }
    if(tiltTarget!==null){tilt+=(tiltTarget-tilt)*0.12;if(Math.abs(tiltTarget-tilt)<0.004)tiltTarget=null;}
    if(zoomTarget!==null){zoom+=(zoomTarget-zoom)*0.12;if(Math.abs(zoomTarget-zoom)<0.01)zoomTarget=null;}
    if(panXT!==null){
      panX+=(panXT-panX)*0.15;panY+=(panYT-panY)*0.15;
      if(Math.abs(panXT-panX)<1&&Math.abs(panYT-panY)<1){panX=panXT;panY=panYT;panXT=null;panYT=null;}
    }
    draw();
    requestAnimationFrame(frame);
  }
  window.addEventListener("resize",()=>{resize();});
  // "关于这张图" 按钮：点击后聚焦一个示例节点
  document.getElementById("aboutBtn").addEventListener("click",e=>{
    e.preventDefault();
    const idx=keyIdx["m_frac"];
    if(idx!==undefined) selectNode(idx,true);
  });
  resize();
  requestAnimationFrame(frame);
})();
