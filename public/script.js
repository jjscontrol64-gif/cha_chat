const inputText   = document.getElementById('inputText');
const outputArea  = document.getElementById('outputArea');
const transformBtn = document.getElementById('transformBtn');
const copyBtn     = document.getElementById('copyBtn');
const charCount   = document.getElementById('charCount');
const loadingOverlay = document.getElementById('loadingOverlay');
const errorMsg    = document.getElementById('errorMsg');

// 글자 수 실시간 업데이트
inputText.addEventListener('input', () => {
  charCount.textContent = inputText.value.length;
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  setTimeout(() => { errorMsg.style.display = 'none'; }, 5000);
}

function setLoading(active) {
  loadingOverlay.style.display = active ? 'flex' : 'none';
  transformBtn.disabled = active;
}

async function transformText() {
  const text = inputText.value.trim();
  if (!text) {
    showError('변환할 문장을 입력해주세요.');
    return;
  }

  const lang = document.querySelector('input[name="lang"]:checked').value;

  errorMsg.style.display = 'none';
  copyBtn.style.display = 'none';
  outputArea.innerHTML = '<p class="placeholder-text">변환된 문장이 이곳에 나타날 것이니...</p>';

  setLoading(true);

  try {
    const response = await fetch('/api/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || '알 수 없는 오류가 발생했습니다.');
      return;
    }

    outputArea.textContent = data.result;
    copyBtn.style.display = 'block';
    saveToHistory(text, data.result, lang);
  } catch (err) {
    showError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
  } finally {
    setLoading(false);
  }
}

async function copyResult() {
  const text = outputArea.textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = '✓ 복사됨';
    setTimeout(() => {
      copyBtn.innerHTML = '<span class="btn-icon">📜</span> 복사하기';
    }, 2000);
  } catch {
    showError('복사에 실패했습니다. 직접 선택하여 복사해주세요.');
  }
}

// Enter 키 단축키 (Ctrl+Enter)
inputText.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    transformText();
  }
});

// ── History ──────────────────────────────────────────────
const HISTORY_KEY = 'cha_chat_history';
const HISTORY_MAX = 5;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveToHistory(input, output, lang) {
  const history = loadHistory();
  history.unshift({ input, output, lang, timestamp: Date.now() });
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimestamp(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function renderHistory() {
  const history = loadHistory();
  const list = document.getElementById('historyList');

  if (history.length === 0) {
    list.innerHTML = '<p class="history-empty">기록된 변환이 없습니다.</p>';
    return;
  }

  list.innerHTML = history.map((item, i) => `
    <div class="history-item">
      <div class="history-item-meta">
        <span class="history-lang">${item.lang === 'ko' ? '한글' : 'EN'}</span>
        <span class="history-time">${formatTimestamp(item.timestamp)}</span>
      </div>
      <p class="history-preview">${escapeHtml(item.input.slice(0, 60))}${item.input.length > 60 ? '…' : ''}</p>
      <p class="history-output">${escapeHtml(item.output)}</p>
      <button class="history-copy-btn" onclick="copyHistoryItem(${i})">📜 복사</button>
    </div>
  `).join('');
}

function toggleHistory() {
  const panel = document.getElementById('historyPanel');
  const btn = document.getElementById('historyToggleBtn');
  const isHidden = panel.style.display === 'none';
  panel.style.display = isHidden ? 'block' : 'none';
  btn.textContent = isHidden ? '📜 기록 닫기' : '📜 기록 보기';
}

async function copyHistoryItem(index) {
  const item = loadHistory()[index];
  if (!item) return;
  try {
    await navigator.clipboard.writeText(item.output);
    const btns = document.querySelectorAll('.history-copy-btn');
    const btn = btns[index];
    btn.textContent = '✓ 복사됨';
    setTimeout(() => { btn.textContent = '📜 복사'; }, 2000);
  } catch {
    showError('복사에 실패했습니다.');
  }
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

// 페이지 로드 시 기록 초기화
renderHistory();
