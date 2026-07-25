async (page) => {
  const html = `
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>小梧的进位加法乐园</title>
<script src="https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.min.js"></script>
<style>
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap');
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:linear-gradient(135deg,#FFF6E5,#FFE8D6);min-height:100vh}
body{padding:20px 0;font-family:'ZCOOL KuaiLe',system-ui,sans-serif}
#xhw-add{--ink:#3A3A55;--one:#FF9F43;--one-l:#FFE0C2;--ten:#54A0FF;--ten-l:#CFE4FF;--hun:#A55EEA;--hun-l:#E8D5F5;--carry:#FF6B6B;--ok:#26DE81;--gold:#FFD166;background:linear-gradient(135deg,#FFF6E5,#FFE8D6);border-radius:28px;padding:26px;color:var(--ink);width:fit-content;min-width:560px;margin:0 auto;box-shadow:0 10px 36px rgba(255,159,67,.18)}
.title{font-size:30px;text-align:center;color:#FF6B6B;margin:0 0 6px;letter-spacing:2px}
.title small{display:block;font-size:14px;color:#7F8C8D;font-weight:normal;letter-spacing:0;margin-top:2px}
.toolbar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;align-items:center}
.btn{font-family:inherit;font-size:17px;padding:9px 18px;border:2px solid transparent;border-radius:16px;background:#fff;color:var(--ink);cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.08);transition:.15s}
.btn:hover{transform:translateY(-1px)}
.btn:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(0,0,0,.08)}
.btn.on{background:var(--one);color:#fff}
.btn.pri{background:var(--carry);color:#fff}
.inputrow{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;align-items:center;font-size:16px}
.inputrow input{font-family:inherit;font-size:18px;width:84px;padding:6px 10px;border:2px solid var(--one-l);border-radius:12px;text-align:center;color:var(--ink)}
.inputrow input:focus{outline:none;border-color:var(--one)}
.problem{display:flex;align-items:center;justify-content:center;gap:12px;font-size:40px;margin:6px 0 16px;flex-wrap:wrap}
.problem .nm{padding:6px 18px;border-radius:16px;color:#fff;min-width:60px;text-align:center}
.problem .nm.a{background:var(--one)}
.problem .nm.b{background:var(--ten)}
.problem .nm.q{background:#fff;color:var(--carry);border:2px dashed var(--carry)}
.problem .nm.ans{background:var(--ok)}
.problem .op{color:#7F8C8D}
.game-area{display:flex;flex-direction:row;gap:18px;align-items:flex-start;justify-content:center;flex-wrap:wrap}
#canvas-wrap{display:flex;justify-content:center;align-items:center;background:rgba(255,255,255,.55);border-radius:18px;padding:10px;min-height:360px;flex:0 1 auto}
#canvas-wrap canvas{display:block;border-radius:12px}
.vertical{background:#fff;border-radius:18px;padding:18px 14px 12px;display:flex;flex-direction:column;align-items:center;gap:0;min-width:170px;flex:0 0 auto}
.vs-row{display:flex;gap:4px;justify-content:center;align-items:center;height:46px}
.vs-cell{width:44px;height:46px;display:flex;align-items:center;justify-content:center;font-size:34px;border-radius:8px}
.vs-cell.op{font-size:28px;color:#7F8C8D;width:30px}
.vs-cell.cm{color:var(--carry);font-size:17px;align-items:flex-end;padding-bottom:2px;font-weight:bold;height:24px}
.vs-cell.va{color:var(--one)}
.vs-cell.vb{color:var(--ten)}
.vs-cell.vr{color:var(--ok)}
.vs-carryrow{height:24px;display:flex;gap:4px;justify-content:center;align-items:flex-end}
.vs-line{height:4px;background:var(--ink);width:100%;border-radius:2px;margin:2px 0 3px}
.narr{background:#fff;border-radius:16px;padding:14px 18px;font-size:21px;text-align:center;min-height:58px;margin-top:16px;color:#5A5A7A;border:2px solid var(--one-l)}
.ctrl{display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap}
.prog{display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap}
.dot{width:10px;height:10px;border-radius:50%;background:#E0D6C8;transition:.2s}
.dot.on{background:var(--one-l)}
.dot.cur{background:var(--one);transform:scale(1.5)}
.legend{display:flex;gap:16px;justify-content:center;font-size:15px;color:#7F8C8D;margin-top:12px;flex-wrap:wrap}
.lg{display:flex;align-items:center;gap:5px}
.lg .sw{width:16px;height:16px;border-radius:4px}
</style>
</head>
<body>
<div id="xhw-add">
<h1 class="title">🎈 小梧的进位加法乐园 <small>满十进一，我来啦！</small></h1>
<div class="toolbar">
  <button class="btn on" id="d2">2 位数</button>
  <button class="btn" id="d3">3 位数</button>
  <button class="btn pri" id="newt">🎲 换一题</button>
</div>
<div class="inputrow">
  <span>自己出题：</span>
  <input id="inA" type="number" inputmode="numeric" placeholder="数A">
  <span>+</span>
  <input id="inB" type="number" inputmode="numeric" placeholder="数B">
  <button class="btn" id="go">开始算</button>
</div>
<div class="problem" id="prob"></div>
<div class="game-area">
  <div id="canvas-wrap"></div>
  <div class="vertical" id="vert"></div>
</div>
<div class="narr" id="narr"></div>
<div class="ctrl">
  <button class="btn" id="prev">⬅ 上一步</button>
  <button class="btn pri" id="next">下一步 ➡</button>
  <button class="btn" id="auto">▶ 自动</button>
  <button class="btn" id="replay">🔄 重播</button>
</div>
<div class="prog" id="prog"></div>
<div class="legend" id="legend"></div>
</div>
<script>
window.addEventListener('load', function(){
  var root=document.getElementById('xhw-add');
  var probEl=root.querySelector('#prob'),vertEl=root.querySelector('#vert'),
      narrEl=root.querySelector('#narr'),progEl=root.querySelector('#prog');
  var problem={a:47,b:26,n:2},phases=[],idx=0,autoT=null;
  var PN=['个位','十位','百位','千位'];

  /* ========== 声音系统 ========== */
  var SoundManager=function(){this.ctx=null;this.enabled=true;};
  SoundManager.prototype.init=function(){
    if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
    if(this.ctx&&this.ctx.state==='suspended'){this.ctx.resume();}
  };
  SoundManager.prototype.tone=function(f,d,type,vol,when){
    if(!this.ctx||!this.enabled)return;
    type=type||'sine';vol=vol==null?0.3:vol;when=when||0;
    var t=this.ctx.currentTime+when;
    var o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vol,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.001,t+d);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);o.stop(t+d);
  };
  SoundManager.prototype.slide=function(f1,f2,d,type,vol){
    if(!this.ctx||!this.enabled)return;
    type=type||'sine';vol=vol==null?0.3:vol;
    var t=this.ctx.currentTime;
    var o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f1,t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f2,1),t+d);
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vol,t+0.03);
    g.gain.exponentialRampToValueAtTime(0.001,t+d);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);o.stop(t+d);
  };
  SoundManager.prototype.pop=function(){this.tone(880,0.08,'sine',0.18);this.tone(1320,0.06,'sine',0.1,0.03);};
  SoundManager.prototype.gatherSnd=function(){this.slide(500,900,0.35,'triangle',0.18);};
  SoundManager.prototype.mergeSnd=function(){this.tone(1046,0.12,'sine',0.28);this.tone(1568,0.2,'sine',0.28,0.1);};
  SoundManager.prototype.flySnd=function(){this.slide(700,1400,0.6,'sine',0.22);};
  SoundManager.prototype.ding=function(){this.tone(659,0.12,'sine',0.2);};
  SoundManager.prototype.correct=function(){this.tone(523,0.15,'sine',0.3);this.tone(659,0.15,'sine',0.3,0.13);this.tone(784,0.3,'sine',0.3,0.26);this.tone(1046,0.4,'sine',0.25,0.4);};
  SoundManager.prototype.clickSnd=function(){this.tone(600,0.04,'square',0.08);};
 var sound=new SoundManager();
 var zhVoice=null,speechPrimed=false,pendingSay=null,ttsAudio=null;
 function loadVoices(){
   if(!('speechSynthesis'in window))return;
   var vs=speechSynthesis.getVoices();
   if(vs.length&&!zhVoice){
     zhVoice=vs.filter(function(v){return /zh-CN/i.test(v.lang);})[0]
       ||vs.filter(function(v){return /zh/i.test(v.lang);})[0]||null;
   }
 }
 if('speechSynthesis'in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}
 function ensureAudio(){sound.init();
   if('speechSynthesis'in window){try{speechSynthesis.resume();}catch(e){}}
   if(!speechPrimed){speechPrimed=true;
     if(pendingSay){var s=pendingSay;pendingSay=null;setTimeout(function(){speak(s);},60);}
   }
 }
 document.addEventListener('pointerdown',function(){ensureAudio();},{once:true});
 
 function speakLocal(t){
   try{
     if(!('speechSynthesis'in window))return;
     loadVoices();
     var u=new SpeechSynthesisUtterance(t);
     u.lang='zh-CN';u.rate=0.85;
     if(zhVoice)u.voice=zhVoice;
     window.speechSynthesis.speak(u);
   }catch(e){}
 }
 function speak(t){
   if(!speechPrimed){pendingSay=t;return;}
   if(ttsAudio){try{ttsAudio.pause();}catch(e){}ttsAudio=null;}
   if('speechSynthesis'in window){try{speechSynthesis.cancel();}catch(e){}}
   var url='https://fanyi.baidu.com/gettts?lan=zh&text='+encodeURIComponent(t)+'&spd=3&source=web';
   ttsAudio=new Audio(url);
   ttsAudio.onended=function(){ttsAudio=null;};
   var p=ttsAudio.play();
   if(p&&p.catch){p.catch(function(){ttsAudio=null;speakLocal(t);});}
 }

  /* ========== PixiJS 初始化 ========== */
  var PIG_SIZE=34,PIG_GAP=4,PIG_COLS=5,COL_W=190,COL_GAP=16,PAD=24,CANVAS_H=360;
  var PILE_Y=48;
  var ROW_H=2*(PIG_SIZE+PIG_GAP)+6;
  var app=new PIXI.Application({width:432,height:CANVAS_H,backgroundAlpha:0,antialias:true,resolution:window.devicePixelRatio||1,autoDensity:true});
  document.getElementById('canvas-wrap').appendChild(app.view);
  var blocksLayer=new PIXI.Container();app.stage.addChild(blocksLayer);
  var activeTweens=[],activeSparkles=[];
  function clearAll(){
    for(var i=0;i<activeTweens.length;i++)app.ticker.remove(activeTweens[i]);
    for(var i=0;i<activeSparkles.length;i++)app.ticker.remove(activeSparkles[i]);
    activeTweens=[];activeSparkles=[];
    blocksLayer.removeChildren();
  }

  /* ========== tween + easing ========== */
  var Ease={
    linear:function(t){return t;},
    easeOut:function(t){return 1-Math.pow(1-t,3);},
    easeIn:function(t){return t*t;},
    easeInOut:function(t){return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;},
    back:function(t){var c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},
    bounce:function(t){var n=4;if(t<(1/n))return 7.5625*t*t;if(t<(2/n)){t-=1.5/n;return 7.5625*t*t+0.75;}if(t<(2.5/n)){t-=2.25/n;return 7.5625*t*t+0.9375;}t-=2.625/n;return 7.5625*t*t+0.984375;}
  };
  function tween(obj,props,duration,easing,onComplete){
    var startTime=performance.now(),startVals={};
    for(var k in props){
      var v=props[k];
      if(typeof v==='object'){startVals[k]={x:obj[k].x,y:obj[k].y};}
      else{startVals[k]=obj[k];}
    }
    var handler=function(){
      var elapsed=(performance.now()-startTime)/1000;
      var t=Math.min(elapsed/duration,1);
      var e=easing?easing(t):t;
      for(var k in props){
        var v=props[k];
        if(typeof v==='object'){
          if(v.x!==undefined)obj[k].x=startVals[k].x+(v.x-startVals[k].x)*e;
          if(v.y!==undefined)obj[k].y=startVals[k].y+(v.y-startVals[k].y)*e;
        }else{obj[k]=startVals[k]+(v-startVals[k])*e;}
      }
      if(t>=1){app.ticker.remove(handler);var i=activeTweens.indexOf(handler);if(i>=0)activeTweens.splice(i,1);if(onComplete)onComplete();}
    };
    app.ticker.add(handler);activeTweens.push(handler);
    return handler;
  }
  function stopTween(h){if(h){app.ticker.remove(h);var i=activeTweens.indexOf(h);if(i>=0)activeTweens.splice(i,1);}}

  /* ========== 小猪创建 ========== */
  function createPig(type){
    var c=new PIXI.Container(),s=PIG_SIZE;
    var bg=new PIXI.Graphics();
    if(type==='hot'){
      bg.beginFill(0xFF6B6B,1);bg.drawRoundedRect(-s/2,-s/2,s,s,8);bg.endFill();
      bg.lineStyle(3,0xFFCACA,1);bg.drawRoundedRect(-s/2,-s/2,s,s,8);
    }else{
      var colors={a:0xFFE0C2,b:0xCFE4FF,r:0xE8D5F5};
      bg.beginFill(colors[type]||0xFFE0C2,0.9);bg.drawRoundedRect(-s/2,-s/2,s,s,8);bg.endFill();
    }
    c.addChild(bg);
    var txt=new PIXI.Text('🐷',{fontSize:Math.round(s*0.78),fontFamily:'system-ui, sans-serif',fill:0x3A3A55});
    txt.anchor.set(0.5);c.addChild(txt);
    c._type=type;return c;
  }
  function createGlowPig(){
    var c=new PIXI.Container(),s=PIG_SIZE;
    var glow=new PIXI.Graphics();
    glow.beginFill(0xFFD166,0.22);glow.drawCircle(0,0,s*0.95);glow.endFill();
    for(var i=0;i<8;i++){
      var a=(i/8)*Math.PI*2;
      glow.lineStyle(3,0xFFD166,0.5);
      glow.moveTo(Math.cos(a)*s*0.55,Math.sin(a)*s*0.55);
      glow.lineTo(Math.cos(a)*s*1.15,Math.sin(a)*s*1.15);
    }
    c.addChild(glow);c._glow=glow;c._type='c';
    var bg=new PIXI.Graphics();
    bg.beginFill(0xFFD166,1);bg.drawCircle(0,0,s*0.62);bg.endFill();
    bg.lineStyle(3,0xFF6B6B,1);bg.drawCircle(0,0,s*0.62);
    c.addChild(bg);
    var txt=new PIXI.Text('🐷',{fontSize:Math.round(s*0.78),fontFamily:'system-ui, sans-serif',fill:0x3A3A55});
    txt.anchor.set(0.5);c.addChild(txt);
    return c;
  }
  function startSparkle(pig){
    var t0=performance.now();
    var handler=function(){
      var t=(performance.now()-t0)/1000;
      var pulse=1+Math.sin(t*6)*0.1;
      pig.scale.set(pulse);
      if(pig._glow){pig._glow.rotation=t*2;pig._glow.alpha=0.4+Math.sin(t*8)*0.25;}
    };
    app.ticker.add(handler);activeSparkles.push(handler);pig._sparkle=handler;
  }

  /* ========== 步骤系统 ========== */
  function toDigits(num,n){var d=[];for(var i=0;i<n;i++){d.push(num%10);num=Math.floor(num/10);}return d;}
  function resultLen(a,b,n){var s=a+b;return Math.max(n,String(s).length);}
 function buildPhases(a,b,n){
   var aD=toDigits(a,n),bD=toDigits(b,n),ps=[],carry=0,res=[];
   ps.push({type:'intro',say:'小梧你好！我们一起来算 '+a+' 加 '+b+'。',hint:'看右边的竖式，想想等于几呀？'});
   for(var i=0;i<n;i++){
     var s=aD[i]+bD[i]+carry;
     var cstr=carry?'加上刚才进上来的 1，':'';
     ps.push({type:'add',place:i,sum:s,say:PN[i]+'：'+cstr+aD[i]+' 加 '+bD[i]+'，等于 '+s+'。',hint:s>=10?('哎呀，'+s+' 超过 10 啦！红色的 10 只小猪要进位！'):(PN[i]+'合起来是 '+s+'。')});
     if(s>=10){
       ps.push({type:'carry',place:i,sum:s,rem:s-10,say:'满 10 进 1！10 只小猪变成 1 只，进到'+(PN[i+1]||'高位')+'！剩下 '+(s-10)+' 只。',hint:'满十进一！闪闪小猪飞到高位咯～'});
       res.push(s-10);carry=1;
     }else{res.push(s);carry=0;}
   }
   if(carry){ps.push({type:'finalCarry',place:n,say:'最后还进上来 1 只，放在最前面。',hint:'最高位还有一只闪闪进位小猪！'});res.push(1);}
   var ans=parseInt(res.slice().reverse().join(''),10);
   ps.push({type:'result',ans:ans,say:'所以 '+a+' 加 '+b+' 等于 '+ans+'。小梧真棒！🌟',hint:'🎉 算对啦！点「换一题」继续挑战！'});
   return ps;
 }
 function stateAt(k){
   var n=problem.n,aD=toDigits(problem.a,n),bD=toDigits(problem.b,n);
   var rLen=resultLen(problem.a,problem.b,n);
   var places=[];for(var i=0;i<n;i++)places.push({aShow:0,bShow:0,carryIn:0,sumShow:null,done:false,rem:0,carryOut:0,result:null,shown:false,carrying:false});
   var active=-1,showR=false,finC=false;
   for(var i=0;i<=k;i++){
     var p=phases[i];if(!p)break;
     else if(p.type==='add'){active=p.place;places[p.place].shown=true;places[p.place].aShow=aD[p.place];places[p.place].bShow=bD[p.place];places[p.place].sumShow=p.sum;}
     else if(p.type==='carry'){places[p.place].done=true;places[p.place].rem=p.rem;places[p.place].result=p.rem;places[p.place].carryOut=1;if(p.place+1<n)places[p.place+1].carryIn=1;if(i===k)places[p.place].carrying=true;}
     else if(p.type==='finalCarry'){finC=true;}
     else if(p.type==='result'){showR=true;}
   }
   for(var i=0;i<n;i++){
     if(places[i].done)places[i].result=places[i].rem;
     else if(places[i].sumShow!==null&&places[i].sumShow<10)places[i].result=places[i].sumShow;}
   return{n:n,rLen:rLen,aD:aD,bD:bD,places:places,active:active,showR:showR,finC:finC};
 }
   function colGroups(st,pl){
    var g={carry:[],a:[],b:[],result:[]};
    if(pl.carrying){
      for(var k=0;k<pl.carryIn;k++)g.carry.push('c');
      for(var k=0;k<pl.aShow;k++)g.a.push('a');
      for(var k=0;k<pl.bShow;k++)g.b.push('b');
    }else if(pl.done){
      for(var k=0;k<pl.rem;k++)g.result.push('r');
    }else if(pl.shown){
      for(var k=0;k<pl.carryIn;k++)g.carry.push('c');
      for(var k=0;k<pl.aShow;k++)g.a.push('a');
      for(var k=0;k<pl.bShow;k++)g.b.push('b');
    }
    return g;
  }
  function pileHeight(num){if(num===0)return ROW_H;return Math.ceil(num/PIG_COLS)*(PIG_SIZE+PIG_GAP);}

  /* ========== PixiJS blocks + 竖式 渲染 ========== */
  function renderBlocksPixi(st){
    clearAll();
    var n=st.n;
    var showThousand=st.finC||(st.rLen>n);
    var colList=[];
    if(showThousand)colList.push({place:n,thousand:true});
    for(var i=n-1;i>=0;i--)colList.push({place:i,thousand:false});
    var numCols=colList.length;
    var blocksW=numCols*COL_W+(numCols-1)*COL_GAP+PAD*2;

    /* 竖式尺寸 */
    var rLen=st.rLen;
    var vertCols=[];
    if(rLen>n)vertCols.push({place:n,fin:true});
    for(var i=n-1;i>=0;i--)vertCols.push({place:i});
    var CELL_W=42,CELL_H=42;
    var vertW=(vertCols.length+1)*CELL_W+20;
    var VERT_X=blocksW+6;
    var totalW=VERT_X+vertW+PAD;
    app.renderer.resize(totalW,CANVAS_H);

    var colsData=[];
    for(var ci=0;ci<colList.length;ci++){
      var c=colList[ci];
      var colX=PAD+ci*(COL_W+COL_GAP);
      var col=new PIXI.Container();col.x=colX;col.y=0;
      var pl0=c.thousand?null:st.places[c.place];
      var isActive=!c.thousand&&(st.active===c.place||(pl0&&pl0.carrying));
      /* label */
      var labBg=new PIXI.Graphics();
      labBg.beginFill(isActive?0xFF6B6B:0xFFFFFF,1);
      labBg.drawRoundedRect(-48,0,96,28,13);labBg.endFill();
      var labTxt=new PIXI.Text(PN[c.place],{fontSize:16,fontFamily:'system-ui, sans-serif',fill:isActive?0xFFFFFF:0x7F8C8D});
      labTxt.anchor.set(0.5);labTxt.x=0;labTxt.y=14;
      col.addChild(labBg);col.addChild(labTxt);
      /* pile */
      var pile=new PIXI.Container();pile.x=COL_W/2;pile.y=PILE_Y;
      var pigs=[];
      if(c.thousand){
        if(st.finC){var gp=createGlowPig();gp.x=0;gp.y=PIG_SIZE/2;pile.addChild(gp);startSparkle(gp);pigs.push(gp);}
      }else{
        var pl=st.places[c.place];
        var gr=colGroups(st,pl);
        var isHot=pl.sumShow!==null&&pl.sumShow>=10&&(st.active===c.place&&!pl.done||pl.carrying);
        var step=PIG_SIZE+PIG_GAP;
        var seq=0;
        function drawRow(arr,rowIdx){
          if(!arr.length)return;
          var nc=Math.min(arr.length,PIG_COLS);
          var startX=-((nc-1)*step)/2;
          var yBase=rowIdx*ROW_H+PIG_SIZE/2;
          for(var k=0;k<arr.length;k++){
            var makeHot=isHot&&seq<10&&arr[k]!=='c';
            seq++;
            var pig;
            if(arr[k]==='c'){pig=createGlowPig();startSparkle(pig);}
            else{pig=createPig(makeHot?'hot':arr[k]);}
            var r=Math.floor(k/PIG_COLS),cc=k%PIG_COLS;
            pig.x=startX+cc*step;pig.y=yBase+r*step;
            pile.addChild(pig);pigs.push(pig);
            if(pl.carrying){pig.scale.set(1);}
            else{pig.scale.set(0);(function(pg,delay){setTimeout(function(){tween(pg,{scale:{x:1,y:1}},0.3,Ease.back);},delay);})(pig,k*30);}
          }
        }
        if(gr.result.length){
          drawRow(gr.result,1);
        }else{
          drawRow(gr.a,1);
          drawRow(gr.b,2);
          drawRow(gr.carry,0);
        }
      }
      col.addChild(pile);
      /* count */
      var cv=pigs.length;
      var hotCol=!c.thousand&&isHot&&cv>=10;
      var cntBg=new PIXI.Graphics();
      cntBg.beginFill(hotCol?0xFF6B6B:0xFFFFFF,1);cntBg.drawRoundedRect(-26,0,52,28,11);cntBg.endFill();
      var cntTxt=new PIXI.Text(String(cv),{fontSize:19,fontFamily:'system-ui, sans-serif',fontWeight:'bold',fill:hotCol?0xFFFFFF:0x3A3A55});
      cntTxt.anchor.set(0.5);cntTxt.x=0;cntTxt.y=14;
      var cntY=PILE_Y+3*ROW_H+18;
      var cntC=new PIXI.Container();cntC.x=COL_W/2;cntC.y=cntY;
      cntC.addChild(cntBg);cntC.addChild(cntTxt);
      col.addChild(cntC);
      blocksLayer.addChild(col);
      colsData.push({place:c.place,thousand:c.thousand,col:col,pile:pile,pigs:pigs,colX:colX,cntY:cntY});
    }

    /* ========== 竖式（PixiJS） ========== */
    var vert=new PIXI.Container();vert.x=VERT_X;vert.y=10;
    var vw=(vertCols.length+1)*CELL_W;
    var vbg=new PIXI.Graphics();
    vbg.beginFill(0xFFFFFF,1);vbg.drawRoundedRect(-10,0,vw+20,180,16);vbg.endFill();
    vert.addChild(vbg);
    var yCarry=4,yA=24,yB=68,yLine=112,yR=122;
    var digitStartX=CELL_W;
    for(var ci=0;ci<vertCols.length;ci++){
      var vc=vertCols[ci];
      var dx=digitStartX+ci*CELL_W;
      var cm='';
      if(vc.fin){if(st.places[n-1]&&st.places[n-1].carryOut&&st.places[n-1].done)cm='1';}
      else if(vc.place>0){var lo=st.places[vc.place-1];if(lo&&lo.carryOut&&lo.done)cm='1';}
      if(cm){
        var cmT=new PIXI.Text(cm,{fontSize:14,fontFamily:'system-ui, sans-serif',fontWeight:'bold',fill:0xFF6B6B});
        cmT.anchor.set(0.5);cmT.x=dx+CELL_W/2;cmT.y=yCarry+8;
        vert.addChild(cmT);
      }
      var av=vc.fin?'':st.aD[vc.place];
      var aT=new PIXI.Text(av,{fontSize:28,fontFamily:'system-ui, sans-serif',fontWeight:'bold',fill:0xFF9F43});
      aT.anchor.set(0.5);aT.x=dx+CELL_W/2;aT.y=yA+CELL_H/2;
      vert.addChild(aT);
      var bv=vc.fin?'':st.bD[vc.place];
      var bT=new PIXI.Text(bv,{fontSize:28,fontFamily:'system-ui, sans-serif',fontWeight:'bold',fill:0x54A0FF});
      bT.anchor.set(0.5);bT.x=dx+CELL_W/2;bT.y=yB+CELL_H/2;
      vert.addChild(bT);
      var rt='';
      if(vc.fin){if(st.finC)rt='1';}
      else if(st.places[vc.place].result!==null)rt=st.places[vc.place].result;
      var rT=new PIXI.Text(rt,{fontSize:28,fontFamily:'system-ui, sans-serif',fontWeight:'bold',fill:0x26DE81});
      rT.anchor.set(0.5);rT.x=dx+CELL_W/2;rT.y=yR+CELL_H/2;
      vert.addChild(rT);
    }
    var plusT=new PIXI.Text('+',{fontSize:28,fontFamily:'system-ui, sans-serif',fill:0x7F8C8D});
    plusT.anchor.set(0.5);plusT.x=CELL_W/2;plusT.y=yB+CELL_H/2;
    vert.addChild(plusT);
    var line=new PIXI.Graphics();
    line.lineStyle(3,0x3A3A55,1);
    line.moveTo(0,yLine);
    line.lineTo(digitStartX+vertCols.length*CELL_W,yLine);
    vert.addChild(line);
    blocksLayer.addChild(vert);

    return{cols:colsData,totalW:totalW};
  }

  /* ========== 动画 ========== */
  function pigGlobal(colData,pig){
    return{x:colData.col.x+colData.pile.x+pig.x,y:colData.col.y+colData.pile.y+pig.y};
  }
  function animateCarryPixi(hotPigs,srcCx,srcCy,tgtX,tgtY){
    sound.gatherSnd();
    for(var i=0;i<hotPigs.length;i++){
      (function(pig,i){
        setTimeout(function(){
          tween(pig,{scale:{x:0.2,y:0.2},alpha:0},0.4,Ease.easeIn,function(){
            if(pig.parent)pig.parent.removeChild(pig);
          });
        },i*30);
      })(hotPigs[i],i);
    }
    setTimeout(function(){
      sound.mergeSnd();
      var carry=createGlowPig();carry.x=srcCx;carry.y=srcCy;carry.scale.set(0);
      blocksLayer.addChild(carry);startSparkle(carry);
      tween(carry,{scale:{x:1.3,y:1.3}},0.3,Ease.back);
      setTimeout(function(){
        sound.flySnd();
        tween(carry,{x:tgtX,y:tgtY,scale:{x:1,y:1}},0.8,Ease.easeInOut);
      },350);
    },hotPigs.length*30+250);
  }

  /* ========== DOM 渲染 ========== */
  function renderProblem(st){
    probEl.innerHTML='';
    var a=document.createElement('span');a.className='nm a';a.textContent=problem.a;
    var op=document.createElement('span');op.className='op';op.textContent='+';
    var b=document.createElement('span');b.className='nm b';b.textContent=problem.b;
    var eq=document.createElement('span');eq.className='op';eq.textContent='=';
    var ans=document.createElement('span');
    if(st.showR){ans.className='nm ans';ans.textContent=phases[phases.length-1].ans;}
    else{ans.className='nm q';ans.textContent='?';}
    probEl.appendChild(a);probEl.appendChild(op);probEl.appendChild(b);probEl.appendChild(eq);probEl.appendChild(ans);
  }
  function renderProg(){progEl.innerHTML='';for(var i=0;i<phases.length;i++){var d=document.createElement('span');d.className='dot';if(i<idx)d.classList.add('on');if(i===idx)d.classList.add('cur');progEl.appendChild(d);}}
  function playPhaseSound(type){
    switch(type){
      case 'intro':sound.tone(523,0.18,'sine',0.18);break;
      case 'add':sound.ding();break;
      case 'carry':sound.flySnd();break;
      case 'finalCarry':sound.tone(880,0.18,'sine',0.2);break;
      case 'result':sound.correct();break;
    }
  }

  /* ========== 主渲染 ========== */
  function render(){
    var cur=phases[idx];var st=stateAt(idx);
    renderProblem(st);
    var rd=renderBlocksPixi(st);
    if(vertEl)vertEl.innerHTML='';
    narrEl.textContent=cur.hint;speak(cur.say);renderProg();
    playPhaseSound(cur.type);
    if(cur.type==='carry'){
      var srcCol=null,tgtCol=null;
      for(var i=0;i<rd.cols.length;i++){
        if(rd.cols[i].place===cur.place&&!rd.cols[i].thousand)srcCol=rd.cols[i];
        if(rd.cols[i].place===cur.place+1)tgtCol=rd.cols[i];
      }
      if(srcCol&&srcCol.pigs.length>=10){
        var ab=[],cs=[];
        for(var j=0;j<srcCol.pigs.length;j++){
          var p=srcCol.pigs[j];
          if(p._type==='c')cs.push(p);else ab.push(p);
        }
        var hotPigs=ab.length>=10?ab.slice(0,10):ab.concat(cs).slice(0,10);
        var sx=0,sy=0;
        for(var i=0;i<hotPigs.length;i++){var g=pigGlobal(srcCol,hotPigs[i]);sx+=g.x;sy+=g.y;}
        var srcCx=sx/hotPigs.length,srcCy=sy/hotPigs.length;
        var tgtX,tgtY;
        if(tgtCol){tgtX=tgtCol.col.x+tgtCol.pile.x;tgtY=tgtCol.col.y+tgtCol.pile.y+PIG_SIZE/2;}
        else{tgtX=srcCx;tgtY=srcCy;}
        animateCarryPixi(hotPigs,srcCx,srcCy,tgtX,tgtY);
      }
    }
  }


  /* ========== 控制 ========== */
  function load(a,b,n){problem={a:a,b:b,n:n};phases=buildPhases(a,b,n);idx=0;stopAuto();render();}
  function next(){if(idx<phases.length-1){idx++;render();}else stopAuto();}
  function prev(){if(idx>0){idx--;render();}}
  function stopAuto(){if(autoT){clearInterval(autoT);autoT=null;}root.querySelector('#auto').textContent='▶ 自动';}
  function toggleAuto(){ensureAudio();if(autoT){stopAuto();}else{root.querySelector('#auto').textContent='⏸ 暂停';autoT=setInterval(function(){if(idx>=phases.length-1){stopAuto();}else next();},3000);}}
  function randN(n){var lo=Math.pow(10,n-1),hi=Math.pow(10,n)-1;return Math.floor(Math.random()*(hi-lo+1))+lo;}
  function hasCarry(a,b,n){var aD=toDigits(a,n),bD=toDigits(b,n);for(var i=0;i<n;i++)if(aD[i]+bD[i]>=10)return true;return false;}
  function newProblem(n){var a,b,c=0;do{a=randN(n);b=randN(n);c++;}while(!hasCarry(a,b,n)&&c<50);load(a,b,n);}
  function setDigits(n){if(n===3){root.querySelector('#d3').classList.add('on');root.querySelector('#d2').classList.remove('on');}else{root.querySelector('#d2').classList.add('on');root.querySelector('#d3').classList.remove('on');}}

  /* 事件绑定 */
  root.querySelector('#next').onclick=function(){ensureAudio();sound.clickSnd();next();};
  root.querySelector('#prev').onclick=function(){ensureAudio();sound.clickSnd();prev();};
  root.querySelector('#auto').onclick=function(){sound.clickSnd();toggleAuto();};
  root.querySelector('#replay').onclick=function(){ensureAudio();sound.clickSnd();idx=0;stopAuto();render();};
  root.querySelector('#newt').onclick=function(){ensureAudio();sound.clickSnd();newProblem(problem.n);};
  root.querySelector('#d2').onclick=function(){ensureAudio();sound.clickSnd();setDigits(2);newProblem(2);};
  root.querySelector('#d3').onclick=function(){ensureAudio();sound.clickSnd();setDigits(3);newProblem(3);};
  root.querySelector('#go').onclick=function(){
    ensureAudio();sound.clickSnd();
    var va=root.querySelector('#inA').value,vb=root.querySelector('#inB').value;
    var a=parseInt(va,10),b=parseInt(vb,10);
    if(!a||!b||a<1||b<1){alert('请输入两个大于 0 的数字哦～');return;}
    var na=String(a).length,nb=String(b).length;var n=Math.max(na,nb,2);if(n>3)n=3;
    setDigits(n);load(a,b,n);
  };

  /* 图例 */
  var lg=root.querySelector('#legend');var lgs=[['#FFE0C2','第一个数'],['#CFE4FF','第二个数'],['radial-gradient(circle,#FFF3C0,#FFD166)','进位的1(闪闪)'],['#E8D5F5','结果'],['#FF6B6B','满10要进位']];
  for(var i=0;i<lgs.length;i++){var w=document.createElement('div');w.className='lg';var s=document.createElement('span');s.className='sw';s.style.background=lgs[i][0];w.appendChild(s);w.appendChild(document.createTextNode(lgs[i][1]));lg.appendChild(w);}

  /* 初始化 */
  load(47,26,2);
});
</script>
</body>
</html>
`;
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  return page.title();
}
