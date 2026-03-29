// ── Session ──
const sessionId = crypto.randomUUID();

// ── DOM Refs ──
const messagesEl   = document.getElementById('messages');
const welcomeEl    = document.getElementById('welcomeScreen');
const inputEl      = document.getElementById('userInput');
const sendBtn      = document.getElementById('sendBtn');
const newChatBtn   = document.getElementById('newChatBtn');

// ── Auto-resize textarea ──
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
});

// ── Send on Enter (Shift+Enter = new line) ──
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', newChat);

// ── Suggestion chips ──
function sendSuggestion(text) {
  inputEl.value = text;
  sendMessage();
}

// ── New chat ──
async function newChat() {
  await fetch('/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  messagesEl.innerHTML = '';
  messagesEl.appendChild(createWelcomeScreen());
  inputEl.value = '';
  inputEl.style.height = 'auto';
}

function createWelcomeScreen() {
  const div = document.createElement('div');
  div.id = 'welcomeScreen';
  div.className = 'welcome-screen';
  div.innerHTML = `
    <div class="welcome-icon">🤖</div>
    <h2>Hi, I'm Ask Ingeet! How can I help you today?</h2>
    <p>Ask me anything — I'm here to help with questions, explanations, ideas, and more.</p>
    <div class="suggestion-chips">
      <button class="chip" onclick="sendSuggestion('What is artificial intelligence?')">What is AI?</button>
      <button class="chip" onclick="sendSuggestion('Explain machine learning simply')">Machine Learning</button>
      <button class="chip" onclick="sendSuggestion('Give me a fun fact')">Fun Fact</button>
      <button class="chip" onclick="sendSuggestion('Help me brainstorm ideas')">Brainstorm</button>
    </div>`;
  return div;
}

// ── Main send function ──
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  // Hide welcome screen on first message
  const welcome = document.getElementById('welcomeScreen');
  if (welcome) welcome.remove();

  // Render user message
  appendMessage('user', text);
  inputEl.value = '';
  inputEl.style.height = 'auto';
  setSending(true);

  // Typing indicator
  const typingEl = appendTyping();

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message: text }),
    });

    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    typingEl.remove();
    appendMessage('bot', data.reply);
  } catch (err) {
    typingEl.remove();
    appendMessage('bot', 'Sorry, something went wrong. Please try again.');
  } finally {
    setSending(false);
    inputEl.focus();
  }
}

// ── Render helpers ──
function appendMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  messagesEl.appendChild(msg);
  scrollToBottom();
  return msg;
}

function appendTyping() {
  const msg = document.createElement('div');
  msg.className = 'message bot typing';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  messagesEl.appendChild(msg);
  scrollToBottom();
  return msg;
}

function setSending(state) {
  sendBtn.disabled = state;
  inputEl.disabled = state;
}

function scrollToBottom() {
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
}
