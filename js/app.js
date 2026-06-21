// 塔罗牌占卜 - 应用逻辑 v2
let currentSpread = 'single';
let currentCards = [];
let history = [];

// 加载历史
function loadHistory() {
  try { const s = localStorage.getItem('tarot_history'); if (s) history = JSON.parse(s); }
  catch { history = []; }
}
function saveHistory() {
  localStorage.setItem('tarot_history', JSON.stringify(history.slice(0, 50)));
}
loadHistory();

// 选择牌阵
function selectSpread(spreadId) {
  currentSpread = spreadId;
  document.querySelectorAll('.spread-btn').forEach(b => b.classList.toggle('active', b.dataset.spread === spreadId));
  document.getElementById('spread-desc').textContent = SPREADS[spreadId].desc;
  document.querySelector('.cards-area').classList.remove('active');
  document.getElementById('reading-result').classList.remove('active');
}

// 占卜
function performReading() {
  const spread = SPREADS[currentSpread];
  const count = spread.positions.length;
  currentCards = drawCards(count);
  renderCards(currentCards, spread);
  document.querySelector('.cards-area').classList.add('active');
  document.getElementById('reading-result').classList.remove('active');

  const record = {
    time: new Date().toLocaleString('zh-CN'),
    spread: spread.name,
    cards: currentCards.map(c => ({ id: c.id, name: c.name, reversed: c.isReversed }))
  };
  history.unshift(record);
  saveHistory();
  renderHistory();
}

// 卡片符号
function getCardSymbol(card) {
  if (card.arcana === 'major') {
    const roman = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
    const symbols = ['〇','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
    return symbols[card.id] || roman[card.id] || '?';
  }
  const s = { wands:'🔥', cups:'💧', swords:'⚔️', pentacles:'💎' };
  const n = { 'Ace':'A', 'Page':'P', 'Knight':'K', 'Queen':'Q', 'King':'K' };
  return (s[card.suit] || '♠') + ' ' + (n[card.number] || card.number);
}

function getSuitSymbol(card) {
  const sym = { wands:'♣', cups:'♡', swords:'♠', pentacles:'♢' };
  return sym[card.suit] || '✦';
}

function getSuitLabel(card) {
  if (card.arcana === 'major') return '大阿尔卡纳';
  return { wands:'权杖', cups:'圣杯', swords:'宝剑', pentacles:'星币' }[card.suit] || '';
}

function getBadgeClass(card) {
  if (card.arcana === 'major') return 'badge-major';
  return 'badge-' + card.suit;
}

// 渲染卡片
function renderCards(cards, spread) {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = cards.map((card, i) => {
    const suffix = card.isReversed ? ' (逆位)' : '';
    const symbol = getCardSymbol(card);
    const suitSym = getSuitSymbol(card);
    const suitLabel = getSuitLabel(card);
    const badgeClass = getBadgeClass(card);
    const posLabel = spread.positions[i]?.name || '';
    const revClass = card.isReversed ? 'reversed' : '';

    return `<div class="card-wrapper" onclick="showCardDetail(${card.id}, ${card.isReversed})">
      <div class="card-inner">
        <div class="card-face card-back">
          <div class="card-back-pattern">
            <div class="border-circle"></div>
            <div class="border-circle"></div>
            <div class="border-circle"></div>
            <div class="corner-nw"></div><div class="corner-ne"></div>
            <div class="corner-sw"></div><div class="corner-se"></div>
            <span class="star-center">✦</span>
          </div>
        </div>
        <div class="card-face card-front ${revClass}">
          <div class="card-frame">
            <div class="card-frame-tl"></div><div class="card-frame-tr"></div>
            <div class="card-frame-bl"></div><div class="card-frame-br"></div>
          </div>
          ${card.isReversed ? '<div class="reversed-mark">↕</div>' : ''}
          <div class="card-symbol">
            <div class="card-symbol-main">${symbol}</div>
            <div class="card-symbol-mini">${suitSym} ${suitLabel}</div>
          </div>
          <div class="card-label">
            <div class="name">${card.name}${card.isReversed ? ' 逆位' : ''}</div>
            <div class="name-en">${card.nameEn}</div>
            <span class="badge ${badgeClass}">${suitLabel}</span>
          </div>
        </div>
      </div>
      <div class="card-position-label">${posLabel}</div>
    </div>`;
  }).join('');

  // 逐张翻转
  requestAnimationFrame(() => {
    document.querySelectorAll('.card-wrapper').forEach((el, i) => {
      setTimeout(() => el.classList.add('flipped'), 400 + i * 300);
    });
  });

  const totalDelay = 400 + cards.length * 300 + 800;
  setTimeout(() => showReading(cards, spread), totalDelay);
}

// 解读
function showReading(cards, spread) {
  const el = document.getElementById('reading-result');
  const content = document.getElementById('reading-content');
  const summary = document.getElementById('reading-summary');

  content.innerHTML = cards.map((card, i) => {
    const meaning = card.isReversed ? card.meaningRev : card.meaning;
    const dText = card.isReversed ? '逆位' : '正位';
    const dClass = card.isReversed ? 'reversed' : 'upright';
    return `<div class="reading-card">
      <div class="pos">✦ ${spread.positions[i]?.name || `位置 ${i+1}`}</div>
      <div class="cname">${card.name} <span class="direction ${dClass}">${dText}</span></div>
      <div class="keywords">${card.keywords}</div>
      <div class="meaning">${meaning}</div>
    </div>`;
  }).join('');

  // 智能总结
  const majorCount = cards.filter(c => c.arcana === 'major').length;
  const revCount = cards.filter(c => c.isReversed).length;
  let t = '';
  if (majorCount >= 3) t += '大阿尔卡纳牌出现较多，预示近期的变化对你有着较为深远的影响。';
  else if (majorCount >= 1) t += '有大阿尔卡纳牌出现，这是一个值得关注的时刻。';
  else t += '小阿尔卡纳牌为主，聚焦于日常生活的具体事项。';
  if (revCount >= cards.length * 0.5) t += '逆位牌较多，可能需要重新审视当前的处境和方向。';
  else if (revCount === 0) t += '全部正位，整体运势较为顺畅，保持积极心态。';
  else t += '正逆位平衡，有挑战也有机遇，保持内心的平静与觉察。';
  summary.innerHTML = `<p>${t}</p>`;
  el.classList.add('active');
}

// 卡片详情
function showCardDetail(cardId, isReversed) {
  const card = getCard(cardId);
  if (!card) return;
  const modal = document.getElementById('card-modal');
  const suitLabel = getSuitLabel(card);
  const badgeClass = getBadgeClass(card);
  const meaning = isReversed ? card.meaningRev : card.meaning;

  document.getElementById('modal-body').innerHTML = `
    <button class="close-btn" onclick="closeModal()">&times;</button>
    <h2>${card.name} ${isReversed ? '（逆位）' : '（正位）'}</h2>
    <div class="modal-sub">${card.nameEn} · ${suitLabel}${card.number !== undefined && card.arcana !== 'major' ? ' · ' + card.number : ''}</div>
    <div class="keyword-tags">${card.keywords.split(',').map(k => `<span>${k.trim()}</span>`).join('')}</div>
    <div class="meta">✦ 牌面含义</div>
    <div class="meaning-text ${isReversed ? 'rev' : ''}">${meaning}</div>
    <div style="margin-top:12px">
      <span class="badge ${badgeClass}">${suitLabel}</span>
    </div>
  `;
  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('card-modal').classList.remove('open');
}

// 历史记录
function renderHistory() {
  const el = document.getElementById('history-list');
  if (history.length === 0) {
    el.innerHTML = '<p style="text-align:center;color:var(--text3);font-size:12px;letter-spacing:1px">— 暂无占卜记录 —</p>';
    return;
  }
  el.innerHTML = history.map((h, idx) => `<div class="history-item" onclick="reviewHistory(${idx})">
    <div class="h-time">${h.time}</div>
    <div class="h-spread">${h.spread}</div>
    <div class="h-cards">${h.cards.map(c => c.name + (c.reversed ? ' ↕' : '')).join(' · ')}</div>
  </div>`).join('');
}

function reviewHistory(idx) {
  const h = history[idx];
  if (!h) return;
  currentCards = h.cards.map(c => ({ ...getCard(c.id), isReversed: c.reversed }));
  const spread = Object.values(SPREADS).find(s => s.name === h.spread) || SPREADS.single;
  renderCards(currentCards, spread);
  document.querySelector('.cards-area').classList.add('active');
  document.getElementById('reading-result').classList.remove('active');
}

function clearHistory() {
  if (confirm('确认清空所有占卜记录？')) {
    history = [];
    saveHistory();
    renderHistory();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  selectSpread('single');
  renderHistory();
});
