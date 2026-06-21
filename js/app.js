// 塔罗牌占卜 - 应用逻辑
let currentSpread = 'single';
let currentCards = [];
let history = [];

// 加载历史记录
function loadHistory() {
  try {
    const stored = localStorage.getItem('tarot_history');
    if (stored) history = JSON.parse(stored);
  } catch { history = []; }
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
  document.querySelector('.reading-result').classList.remove('active');
}

// 占卜
function performReading() {
  const spread = SPREADS[currentSpread];
  const count = spread.positions.length;
  currentCards = drawCards(count);
  renderCards(currentCards, spread);
  document.querySelector('.cards-area').classList.add('active');
  document.getElementById('reading-result').classList.remove('active');
  // 记录到历史
  const record = {
    time: new Date().toLocaleString('zh-CN'),
    spread: spread.name,
    cards: currentCards.map(c => ({ id: c.id, name: c.name, reversed: c.isReversed }))
  };
  history.unshift(record);
  saveHistory();
  renderHistory();
}

// 渲染卡片
function renderCards(cards, spread) {
  const grid = document.querySelector('.cards-grid');
  grid.innerHTML = cards.map((card, i) => {
    const suitClass = card.suit ? `badge-${card.suit}` : 'badge-major';
    const suitLabel = card.suit ? {wands:'权杖',cups:'圣杯',swords:'宝剑',pentacles:'星币'}[card.suit] : '大阿尔卡纳';
    const symbol = getCardSymbol(card);
    const posLabel = spread.positions[i]?.name || '';
    const revClass = card.isReversed ? 'reversed' : '';
    return `<div class="card-wrapper" onclick="showCardDetail(${card.id}, ${card.isReversed})">
      <div class="card-inner">
        <div class="card-face card-back">
          <div class="card-back-pattern">✦</div>
        </div>
        <div class="card-face card-front ${revClass}">
          <div class="card-symbol">${symbol}</div>
          <div class="card-label">
            <div class="name">${card.name}${card.isReversed ? ' 逆位' : ''}</div>
            <div class="name-en">${card.nameEn}</div>
            <span class="badge ${suitClass}">${suitLabel}</span>
          </div>
        </div>
      </div>
      <div class="card-position-label">${posLabel}</div>
    </div>`;
  }).join('');
  // 翻转动画
  requestAnimationFrame(() => {
    document.querySelectorAll('.card-wrapper').forEach((el, i) => {
      setTimeout(() => el.classList.add('flipped'), 300 + i * 400);
    });
  });
  // 翻转完后显示解读
  const totalDelay = 300 + cards.length * 400 + 600;
  setTimeout(() => showReading(cards, spread), totalDelay);
}

// 牌符号
function getCardSymbol(card) {
  if (card.arcana === 'major') {
    const symbols = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
    return symbols[card.id] || '?';
  }
  const suitSymbols = { wands:'♣', cups:'♡', swords:'♠', pentacles:'♢' };
  const sym = suitSymbols[card.suit] || '?';
  if (card.number === 'Ace') return `${sym} A`;
  if (card.number === 'Page') return `${sym} ♕`;
  if (card.number === 'Knight') return `${sym} ♘`;
  if (card.number === 'Queen') return `${sym} ♛`;
  if (card.number === 'King') return `${sym} ♚`;
  return `${sym} ${card.number}`;
}

// 显示解读
function showReading(cards, spread) {
  const el = document.getElementById('reading-result');
  const content = document.getElementById('reading-content');
  const summary = document.getElementById('reading-summary');

  // 每个位置解读
  content.innerHTML = cards.map((card, i) => {
    const meaning = card.isReversed ? card.meaningRev : card.meaning;
    const dirText = card.isReversed ? '逆位' : '正位';
    const dirClass = card.isReversed ? 'reversed' : 'upright';
    return `<div class="reading-card">
      <div class="pos">${spread.positions[i]?.name || `位置 ${i+1}`}</div>
      <div class="cname">${card.name} <span class="direction ${dirClass}">${dirText}</span></div>
      <div class="keywords">${card.keywords}</div>
      <div class="meaning">${meaning}</div>
    </div>`;
  }).join('');

  // 智能总结
  const majorCount = cards.filter(c => c.arcana === 'major').length;
  const revCount = cards.filter(c => c.isReversed).length;
  let summaryText = '';
  if (majorCount >= 3) summaryText += '大阿尔卡纳牌出现较多，预示近期的变化对你有着较为深远的影响。';
  else if (majorCount >= 1) summaryText += '有大阿尔卡纳牌出现，这是一个值得关注的时刻。';
  else summaryText += '小阿尔卡纳牌为主，聚焦于日常生活的具体事项。';
  if (revCount >= cards.length * 0.5) summaryText += '逆位牌较多，可能需要重新审视当前的处境和方向。';
  else if (revCount === 0) summaryText += '全部正位，整体运势较为顺畅，保持积极心态。';
  else summaryText += '正逆位平衡，有挑战也有机遇，保持内心的平静与觉察。';
  summary.innerHTML = `<p>${summaryText}</p>`;
  el.classList.add('active');
}

// 卡片详情弹窗
function showCardDetail(cardId, isReversed) {
  const card = getCard(cardId);
  if (!card) return;
  const modal = document.getElementById('card-modal');
  let suitLabel = '大阿尔卡纳';
  let suitClass = 'badge-major';
  if (card.suit) {
    const map = { wands:['权杖','badge-wands'], cups:['圣杯','badge-cups'], swords:['宝剑','badge-swords'], pentacles:['星币','badge-pentacles'] };
    suitLabel = map[card.suit][0];
    suitClass = map[card.suit][1];
  }
  const meaning = isReversed ? card.meaningRev : card.meaning;
  document.getElementById('modal-body').innerHTML = `
    <button class="close-btn" onclick="closeModal()">&times;</button>
    <h2>${card.name} ${isReversed ? '（逆位）' : '（正位）'}</h2>
    <div class="modal-sub">${card.nameEn} · ${suitLabel} · 编号 ${card.number === undefined ? card.number : ''}</div>
    <div class="keyword-tags">${card.keywords.split(',').map(k => `<span>${k.trim()}</span>`).join('')}</div>
    <div class="meta">牌面含义</div>
    <div class="meaning-text ${isReversed ? 'rev' : ''}">${meaning}</div>
  `;
  modal.classList.add('open');
}
function closeModal() {
  document.getElementById('card-modal').classList.remove('open');
}

// 渲染历史
function renderHistory() {
  const el = document.getElementById('history-list');
  if (history.length === 0) {
    el.innerHTML = '<p style="text-align:center;color:var(--text2);font-size:13px">暂无占卜记录</p>';
    return;
  }
  el.innerHTML = history.map((h, idx) => `<div class="history-item" onclick="reviewHistory(${idx})">
    <div class="h-time">${h.time}</div>
    <div class="h-spread">${h.spread}</div>
    <div class="h-cards">${h.cards.map(c => c.name + (c.reversed ? '↕' : '')).join(' · ')}</div>
  </div>`).join('');
}

// 回顾历史
function reviewHistory(idx) {
  const h = history[idx];
  if (!h) return;
  // 重新展示这个记录的牌阵和解读
  currentCards = h.cards.map(c => ({ ...getCard(c.id), isReversed: c.reversed }));
  const spread = Object.values(SPREADS).find(s => s.name === h.spread) || SPREADS.single;
  // 展示牌面
  renderCards(currentCards, spread);
  document.querySelector('.cards-area').classList.add('active');
  document.getElementById('reading-result').classList.remove('active');
  // 不需要重新记录历史
}

// 清空历史
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
