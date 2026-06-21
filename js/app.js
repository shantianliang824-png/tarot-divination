// 塔罗牌占卜 v3 - 3D 转盘选牌
let currentSpread = 'single';
let selectedCards = [];
let carouselCards = [];
let carouselAngle = 0;
let carouselRunning = false;
let history = [];
let needToSelect = 1;

// Load history
(function(){try{const s=localStorage.getItem('tarot_history');if(s)history=JSON.parse(s)}catch{}})();
function saveHistory(){localStorage.setItem('tarot_history',JSON.stringify(history.slice(0,50)))}

function selectSpread(id){
  currentSpread=id;
  document.querySelectorAll('.spread-btn').forEach(b=>b.classList.toggle('active',b.dataset.spread===id));
  document.getElementById('spread-desc').textContent=SPREADS[id].desc;
  hideAllResults();
}

function hideAllResults(){
  document.getElementById('carousel-section').classList.remove('active');
  document.getElementById('cards-area').classList.remove('active');
  document.getElementById('reading-result').classList.remove('active');
  carouselRunning=false;
}

// ===== 3D Carousel =====
const CAROUSEL_CARDS=24;
const CAROUSEL_RADIUS=280;

function startCarousel(){
  hideAllResults();
  selectedCards=[];
  const spread=SPREADS[currentSpread];
  needToSelect=spread.positions.length;

  // Shuffle and pick cards for carousel
  const shuffled=shuffleDeck();
  carouselCards=shuffled.slice(0,CAROUSEL_CARDS);

  renderCarousel();
  updateSelectionInfo();
  document.getElementById('carousel-section').classList.add('active');
  document.getElementById('reveal-btn').classList.remove('show');

  // Start rotation
  carouselRunning=true;
  carouselAngle=0;
  requestAnimationFrame(animateCarousel);
}

function renderCarousel(){
  const stage=document.getElementById('carousel-stage');
  const angleStep=360/CAROUSEL_CARDS;
  stage.innerHTML=carouselCards.map((card,i)=>{
    const a=angleStep*i;
    return `<div class="carousel-card" data-index="${i}" onclick="toggleCard(${i})"
      style="transform:rotateY(${a}deg) translateZ(${CAROUSEL_RADIUS}px)">
      <div class="back-design">✦</div>
      <span class="card-index">${i+1}</span>
    </div>`;
  }).join('');
}

function animateCarousel(){
  if(!carouselRunning)return;
  carouselAngle+=0.3;
  const stage=document.getElementById('carousel-stage');
  if(stage)stage.style.transform=`rotateY(${carouselAngle}deg)`;
  requestAnimationFrame(animateCarousel);
}

// ===== Card Selection =====
function toggleCard(index){
  const idx=selectedCards.indexOf(index);
  if(idx>-1){
    selectedCards.splice(idx,1);
  }else{
    if(selectedCards.length>=needToSelect)return; // Max reached
    selectedCards.push(index);
  }
  // Update visual
  const cards=document.querySelectorAll('.carousel-card');
  cards.forEach((el,i)=>{
    el.classList.toggle('selected',selectedCards.includes(i));
  });
  updateSelectionInfo();
}

function updateSelectionInfo(){
  const left=needToSelect-selectedCards.length;
  const count=document.getElementById('selection-count');
  const info=document.getElementById('selection-info');
  count.textContent=left;
  if(left===0){
    info.innerHTML='已选够 <span class="count">0</span> 张，点击下方查看解读';
    document.getElementById('reveal-btn').classList.add('show');
  }else{
    info.innerHTML=`请在牌圈中选择 <span class="count">${left}</span> 张牌`;
    document.getElementById('reveal-btn').classList.remove('show');
  }
}

// ===== Reveal Selected =====
function revealSelected(){
  if(selectedCards.length!==needToSelect)return;
  carouselRunning=false;
  document.getElementById('carousel-section').classList.remove('active');

  // Get selected cards with their full data + reversed
  currentCards=selectedCards.map(i=>{
    const c={...carouselCards[i]};
    c.isReversed=Math.random()<0.5;
    return c;
  });

  renderRevealCards(currentCards,SPREADS[currentSpread]);
  document.getElementById('cards-area').classList.add('active');

  // Record history
  const record={
    time:new Date().toLocaleString('zh-CN'),
    spread:SPREADS[currentSpread].name,
    cards:currentCards.map(c=>({id:c.id,name:c.name,reversed:c.isReversed}))
  };
  history.unshift(record);
  saveHistory();
  renderHistory();

  // Show reading after cards flip
  const totalDelay=400+currentCards.length*300+800;
  setTimeout(()=>showReading(currentCards,SPREADS[currentSpread]),totalDelay);
}

function renderRevealCards(cards,spread){
  const grid=document.getElementById('cards-grid');
  grid.innerHTML=cards.map((card,i)=>{
    const sym=getCardSymbol(card);
    const label=getSuitLabel(card);
    const badge=getBadgeClass(card);
    const revClass=card.isReversed?'reversed':'';
    const pos=spread.positions[i]?.name||'';
    return `<div class="card-wrapper" onclick="showCardDetail(${card.id},${card.isReversed})">
      <div class="card-inner">
        <div class="card-face card-back"><div class="center-star">✦</div></div>
        <div class="card-face card-front ${revClass}">
          ${card.isReversed?'<div style="position:absolute;top:4px;right:4px;font-size:9px;color:var(--danger);opacity:.7">↕</div>':''}
          <div class="card-symbol">
            <div class="card-symbol-main">${sym}</div>
            <div class="card-symbol-mini">${label}</div>
          </div>
          <div class="card-label">
            <div class="name">${card.name}${card.isReversed?' 逆位':''}</div>
            <div class="name-en">${card.nameEn}</div>
            <span class="badge ${badge}">${label}</span>
          </div>
        </div>
      </div>
      <div class="card-position-label">${pos}</div>
    </div>`;
  }).join('');

  requestAnimationFrame(()=>{
    document.querySelectorAll('.card-wrapper').forEach((el,i)=>{
      setTimeout(()=>el.classList.add('flipped'),400+i*300);
    });
  });
}

// ===== Card Helper Functions =====
function getCardSymbol(card){
  if(card.arcana==='major'){
    const a=['〇','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
    return a[card.id]||'?';
  }
  const m={wands:'♣',cups:'♡',swords:'♠',pentacles:'♢'};
  const n={'Ace':'A','Page':'P','Knight':'K','Queen':'Q','King':'K'};
  return (m[card.suit]||'♠')+' '+(n[card.number]||card.number);
}
function getSuitLabel(c){
  if(c.arcana==='major')return'大阿尔卡纳';
  return{wands:'权杖',cups:'圣杯',swords:'宝剑',pentacles:'星币'}[c.suit]||'';
}
function getBadgeClass(c){
  return c.arcana==='major'?'badge-major':'badge-'+c.suit;
}

function showReading(cards,spread){
  const el=document.getElementById('reading-result');
  const content=document.getElementById('reading-content');
  const summary=document.getElementById('reading-summary');

  content.innerHTML=cards.map((card,i)=>{
    const meaning=card.isReversed?card.meaningRev:card.meaning;
    const dText=card.isReversed?'逆位':'正位';
    const dClass=card.isReversed?'reversed':'upright';
    return `<div class="reading-card">
      <div class="pos">✦ ${spread.positions[i]?.name||'位置'+(i+1)}</div>
      <div class="cname">${card.name} <span class="direction ${dClass}">${dText}</span></div>
      <div class="keywords">${card.keywords}</div>
      <div class="meaning">${meaning}</div>
    </div>`;
  }).join('');

  const major=cards.filter(c=>c.arcana==='major').length;
  const rev=cards.filter(c=>c.isReversed).length;
  let t='';
  if(major>=3)t+='大阿尔卡纳牌出现较多，预示近期变化对你有深远影响。';
  else if(major>=1)t+='有大阿尔卡纳牌出现，这是一个值得关注的时刻。';
  else t+='小阿尔卡纳牌为主，聚焦于日常生活的具体事项。';
  if(rev>=cards.length*0.5)t+='逆位牌较多，可能需要重新审视当前的处境。';
  else if(rev===0)t+='全部正位，整体运势较为顺畅。';
  else t+='正逆位平衡，有挑战也有机遇。';
  summary.innerHTML=`<p>${t}</p>`;
  el.classList.add('active');
}

function showCardDetail(cardId,isReversed){
  const card=getCard(cardId);
  if(!card)return;
  const m=document.getElementById('card-modal');
  const meaning=isReversed?card.meaningRev:card.meaning;
  document.getElementById('modal-body').innerHTML=`
    <button class="close-btn" onclick="closeModal()">&times;</button>
    <h2>${card.name}${isReversed?'（逆位）':'（正位）'}</h2>
    <div class="modal-sub">${card.nameEn} · ${getSuitLabel(card)}</div>
    <div class="keyword-tags">${card.keywords.split(',').map(k=>'<span>'+k.trim()+'</span>').join('')}</div>
    <div class="meta">✦ 牌面含义</div>
    <div class="meaning-text${isReversed?' rev':''}">${meaning}</div>`;
  m.classList.add('open');
}
function closeModal(){document.getElementById('card-modal').classList.remove('open')}

// History
function renderHistory(){
  const el=document.getElementById('history-list');
  if(history.length===0){
    el.innerHTML='<p style="text-align:center;color:var(--text3);font-size:12px">— 暂无占卜记录 —</p>';
    return;
  }
  el.innerHTML=history.map((h,i)=>`<div class="history-item" onclick="reviewHistory(${i})">
    <div class="h-time">${h.time}</div>
    <div class="h-spread">${h.spread}</div>
    <div class="h-cards">${h.cards.map(c=>c.name+(c.reversed?'↕':'')).join(' · ')}</div>
  </div>`).join('');
}

function reviewHistory(idx){
  const h=history[idx];if(!h)return;
  currentCards=h.cards.map(c=>({...getCard(c.id),isReversed:c.reversed}));
  const spread=Object.values(SPREADS).find(s=>s.name===h.spread)||SPREADS.single;
  hideAllResults();
  renderRevealCards(currentCards,spread);
  document.getElementById('cards-area').classList.add('active');
  setTimeout(()=>showReading(currentCards,spread),800);
}

function clearHistory(){
  if(confirm('确认清空所有占卜记录？')){history=[];saveHistory();renderHistory()}
}

document.addEventListener('DOMContentLoaded',()=>{
  selectSpread('single');
  renderHistory();
});
