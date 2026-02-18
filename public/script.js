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

  errorMsg.style.display = 'none';
  copyBtn.style.display = 'none';
  outputArea.innerHTML = '<p class="placeholder-text">변환된 문장이 이곳에 나타날 것이니...</p>';

  setLoading(true);

  try {
    const response = await fetch('/api/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || '알 수 없는 오류가 발생했습니다.');
      return;
    }

    outputArea.textContent = data.result;
    copyBtn.style.display = 'block';
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
