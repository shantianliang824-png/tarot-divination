// 塔罗牌占卜 v4 - 3D 转盘 + 卡片图样
(function(){
  const $=id=>document.getElementById(id);
  const spread=id=>{currentSpread=id;document.querySelectorAll('.spread-btn').forEach(b=>b.classList.toggle('active',b.dataset.spread===id));$('spread-desc').textContent=SPREADS[id].desc;hideAll()};
  const hideAll=()=>{$('carousel-section').classList.remove('active');$('cards-area').classList.remove('active');$('reading-result').classList.remove('active');carouselRunning=false};

  let currentSpread='single',selectedCards=[],carouselCards=[],carouselAngle=0,carouselRunning=false,history=[],needToSelect=1,cardImages={};

  // Load history
  (()=>{try{const s=localStorage.getItem('tarot_history');if(s)history=JSON.parse(s)}catch(e){}})();
  const saveHistory=()=>localStorage.setItem('tarot_history',JSON.stringify(history.slice(0,50)));

  // Expose to global
  window.selectSpread=spread;window.startCarousel=startCarousel;window.toggleCard=toggleCard;
  window.revealSelected=revealSelected;window.showCardDetail=showCardDetail;window.closeModal=closeModal;
  window.clearHistory=clearHistory;window.reviewHistory=reviewHistory;

  // ===== Card Image Generator (Canvas) =====
  function initCardImages(){
    const c=document.createElement('canvas');c.width=200;c.height=290;
    const ctx=c.getContext('2d');
    const bgGrad=ctx.createLinearGradient(0,0,0,290);
    bgGrad.addColorStop(0,'#0f0b1a');bgGrad.addColorStop(1,'#1a1240');

    TAROT_CARDS.forEach(card=>{
      ctx.clearRect(0,0,200,290);
      // Background
      ctx.fillStyle=bgGrad;ctx.fillRect(0,0,200,290);
      // Border
      ctx.strokeStyle='rgba(42,31,69,0.6)';ctx.lineWidth=1.5;ctx.strokeRect(3,3,194,284);
      ctx.strokeStyle='rgba(212,168,83,0.08)';ctx.lineWidth=1;ctx.strokeRect(8,8,184,274);
      // Corner decorations
      const drawCorner=(x,y)=>{ctx.strokeStyle='rgba(212,168,83,0.1)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(x+12,y);ctx.lineTo(x,y);ctx.lineTo(x,y+12);ctx.stroke()};
      drawCorner(10,10);drawCorner(188,10);drawCorner(10,278);drawCorner(188,278);

      // Center symbol
      const sym=getSymbol(card);const col=getSuitColor(card);
      ctx.font='48px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle=col;ctx.globalAlpha=0.15;ctx.fillText(sym,100,135);
      ctx.globalAlpha=0.9;ctx.font='18px Georgia,serif';ctx.fillText(sym,100,125);

      // Suit symbol top-right
      const suitSym={'wands':'♣','cups':'♡','swords':'♠','pentacles':'♢'};
      if(card.suit){ctx.font='12px serif';ctx.fillStyle=col;ctx.globalAlpha=0.6;
        ctx.fillText(suitSym[card.suit]||'✦',178,30)}

      // Number / Roman
      ctx.font='bold 12px Georgia,serif';ctx.fillStyle=col;ctx.globalAlpha=0.8;
      ctx.textAlign='left';ctx.textBaseline='top';
      const num=card.arcana==='major'?['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'][card.id]||'':card.number;
      if(num)ctx.fillText(num,16,16);

      // Name
      ctx.globalAlpha=0.9;ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.font='13px Georgia,serif';ctx.fillStyle='#d4a853';ctx.fillText(card.name,100,270);
      ctx.font='8px Georgia,serif';ctx.fillStyle='#8a7fb0';ctx.fillText(card.nameEn,100,280);

      // Gold line
      ctx.strokeStyle='rgba(212,168,83,0.15)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(40,270-30);ctx.lineTo(160,270-30);ctx.stroke();

      ctx.globalAlpha=1;
      cardImages[card.id]=c.toDataURL();
    });
  }

  function getSymbol(card){
    if(card.arcana==='major'){const a=['〇','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];return a[card.id]||'?'}
    const m={wands:'♣',cups:'♡',swords:'♠',pentacles:'♢'},n={'Ace':'A','Page':'P','Knight':'K','Queen':'Q','King':'K'};
    return (m[card.suit]||'♠')+' '+(n[card.number]||card.number);
  }
  function getSuitColor(card){
    if(card.arcana==='major')return'#d4a853';
    return{wands:'#ff6b35',cups:'#47b5ff',swords:'#b0b0c0',pentacles:'#4cd964'}[card.suit]||'#d4a853';
  }
  function getSuitLabel(c){return c.arcana==='major'?'大阿尔卡纳':{wands:'权杖',cups:'圣杯',swords:'宝剑',pentacles:'星币'}[c.suit]||''}
  function getBadge(c){return c.arcana==='major'?'badge-major':'badge-'+c.suit}

  // ===== 3D Carousel =====
  const C_COUNT=24,RADIUS=300;

  function startCarousel(){
    hideAll();selectedCards=[];needToSelect=SPREADS[currentSpread].positions.length;
    const shuffled=shuffleDeck();carouselCards=shuffled.slice(0,C_COUNT);
    const stage=$('carousel-stage');
    const step=360/C_COUNT;
    stage.innerHTML=carouselCards.map((_,i)=>{
      const a=step*i;
      return `<div class="carousel-card" data-i="${i}" style="transform:rotateY(${a}deg) translateZ(${RADIUS}px)"><div class="back-design">✦</div></div>`;
    }).join('');
    $('carousel-section').classList.add('active');$('reveal-btn').classList.remove('show');
    updInfo();carouselRunning=true;carouselAngle=0;

    // Attach click events
    document.querySelectorAll('.carousel-card').forEach(el=>{el.onclick=()=>toggleCard(parseInt(el.dataset.i))});

    // Start animation
    requestAnimationFrame(function anim(){
      if(!carouselRunning)return;
      carouselAngle+=0.3;const s=$('carousel-stage');
      if(s)s.style.transform='rotateY('+carouselAngle+'deg)';
      requestAnimationFrame(anim);
    });
  }

  function toggleCard(idx){
    const p=selectedCards.indexOf(idx);
    if(p>-1)selectedCards.splice(p,1);
    else{if(selectedCards.length>=needToSelect)return;selectedCards.push(idx)}
    document.querySelectorAll('.carousel-card').forEach((el,i)=>el.classList.toggle('selected',selectedCards.includes(i)));
    updInfo();
  }
  function updInfo(){
    const l=needToSelect-selectedCards.length;
    if(l===0){$('selection-info').innerHTML='已选够 <span class="count">0</span> 张，点击下方查看解读';$('reveal-btn').classList.add('show')}
    else{$('selection-info').innerHTML='请在牌圈中选择 <span class="count">'+l+'</span> 张牌';$('reveal-btn').classList.remove('show')}
  }

  // ===== Reveal =====
  function revealSelected(){
    if(selectedCards.length!==needToSelect)return;
    carouselRunning=false;$('carousel-section').classList.remove('active');
    const cards=selectedCards.map(i=>{
      const c=Object.assign({},carouselCards[i]);c.isReversed=Math.random()<0.5;return c;
    });
    currentCards=cards;renderCards(cards);$('cards-area').classList.add('active');
    const rec={time:new Date().toLocaleString('zh-CN'),spread:SPREADS[currentSpread].name,cards:cards.map(c=>({id:c.id,name:c.name,reversed:c.isReversed}))};
    history.unshift(rec);saveHistory();renderHistory();
    setTimeout(()=>showReading(cards),400+cards.length*300+600);
  }

  function renderCards(cards){
    const g=$('cards-grid');const spread=SPREADS[currentSpread];
    g.innerHTML=cards.map((c,i)=>{
      const img=cardImages[c.id]||'';
      const rev=c.isReversed?'rev':'';
      return `<div class="card-wrapper" onclick="showCardDetail(${c.id},${c.isReversed})">
        <div class="card-inner">
          <div class="card-face card-back2"><div class="cs">✦</div></div>
          <div class="card-face card-front2 ${rev}" style="background-image:url('${img}');background-size:cover;background-position:center">
            <div style="position:absolute;top:4px;right:4px;color:var(--danger);font-size:10px;opacity:.7">${c.isReversed?'↕':''}</div>
          </div>
        </div>
        <div class="pos-label">${spread.positions[i]?.name||''}</div>
      </div>`;
    }).join('');
    requestAnimationFrame(()=>{document.querySelectorAll('.card-wrapper').forEach((el,i)=>setTimeout(()=>el.classList.add('flipped'),300+i*250))});
  }

  // ===== Reading =====
  function showReading(cards){
    const el=$('reading-result'),ct=$('reading-content'),sm=$('reading-summary');
    const spread=SPREADS[currentSpread];
    ct.innerHTML=cards.map((c,i)=>{
      const m=c.isReversed?c.meaningRev:c.meaning;
      const dt=c.isReversed?'逆位':'正位',dc=c.isReversed?'r':'u';
      return '<div class="reading-card"><div class="pos">✦ '+(spread.positions[i]?.name||'位置'+(i+1))+'</div><div class="cname">'+c.name+' <span class="dir '+dc+'">'+dt+'</span></div><div class="kw">'+c.keywords+'</div><div class="m">'+m+'</div></div>';
    }).join('');
    const major=cards.filter(c=>c.arcana==='major').length,rev=cards.filter(c=>c.isReversed).length;
    let t='';
    if(major>=3)t+='大阿尔卡纳牌出现较多，预示近期变化对你有深远影响。';
    else if(major>=1)t+='有大阿尔卡纳牌出现，这是一个值得关注的时刻。';
    else t+='小阿尔卡纳牌为主，聚焦于日常生活的具体事项。';
    if(rev>=cards.length*0.5)t+='逆位牌较多，可能需要重新审视当前的处境。';
    else if(rev===0)t+='全部正位，整体运势较为顺畅。';
    else t+='正逆位平衡，有挑战也有机遇。';
    sm.innerHTML='<p>'+t+'</p>';el.classList.add('active');
  }

  function showCardDetail(cardId,isRev){
    const card=getCard(cardId);if(!card)return;
    const m=$('card-modal');const img=cardImages[card.id]||'';
    const meaning=isRev?card.meaningRev:card.meaning;
    const tags=card.keywords.split(',').map(k=>'<span>'+k.trim()+'</span>').join('');
    $('modal-body').innerHTML='<button class="close-btn" onclick="closeModal()">&times;</button><div style="display:flex;gap:16px">'+
      (img?'<img src="'+img+'" style="width:100px;height:145px;border-radius:4px;flex-shrink:0;border:1px solid var(--border)">':'')+
      '<div><h2>'+card.name+(isRev?'（逆位）':'（正位）')+'</h2><div class="sub">'+card.nameEn+' · '+getSuitLabel(card)+'</div>'+
      '<div class="tags">'+tags+'</div><div class="meta">✦ 牌面含义</div><div class="mt'+(isRev?' r':'')+'">'+meaning+'</div></div></div>';
    m.classList.add('open');
  }
  function closeModal(){$('card-modal').classList.remove('open')}

  // ===== History =====
  function renderHistory(){
    const el=$('history-list');
    if(history.length===0){el.innerHTML='<p style="text-align:center;color:var(--text3);font-size:12px">— 暂无占卜记录 —</p>';return}
    el.innerHTML=history.map((h,i)=>'<div class="history-item" onclick="reviewHistory('+i+')"><div class="ht">'+h.time+'</div><div class="hs">'+h.spread+'</div><div class="hc">'+h.cards.map(c=>c.name+(c.reversed?'↕':'')).join(' · ')+'</div></div>').join('');
  }
  function reviewHistory(idx){
    const h=history[idx];if(!h)return;
    currentCards=h.cards.map(c=>Object.assign({},getCard(c.id),{isReversed:c.reversed}));
    hideAll();renderCards(currentCards);$('cards-area').classList.add('active');
    setTimeout(()=>showReading(currentCards),800);
  }
  function clearHistory(){if(confirm('确认清空所有占卜记录？')){history=[];saveHistory();renderHistory()}}

  // ===== Init =====
  document.addEventListener('DOMContentLoaded',()=>{
    initCardImages();spread('single');renderHistory();
  });
})();
