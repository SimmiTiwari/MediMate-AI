/**
 * MediMate AI - Health Chatbot Controller
 * Connects UI to backend Gemini AI endpoint with medical guardrails and typing state.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupChatbot();
});

function setupChatbot() {
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');

  let conversationHistory = [];

  // Handle suggested questions
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        chatInput.value = prompt;
        sendMessage(prompt);
      }
    });
  });

  // Handle Form Submission
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;
      sendMessage(message);
    });
  }

  // Handle Clear Chat
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      window.MediMateConfig.showConfirmDialog(
        'Clear Conversation',
        'Are you sure you want to clear your current chat history?',
        () => {
          conversationHistory = [];
          chatMessages.innerHTML = `
            <div class="message-bubble message-bot">
              <span class="bot-tag">MediMate AI Assistant</span>
              <p>Hello! I am your AI Health & Wellness Assistant. I can help answer general questions about hydration, sleep hygiene, nutrition, and exercise routines.</p>
              <p style="font-size: 0.775rem; color: var(--text-muted); margin-top: 6px;">
                <em>Notice: I provide general educational information only. I cannot diagnose conditions or prescribe medications.</em>
              </p>
            </div>
          `;
          window.MediMateConfig.showToast('Chat history cleared', 'info');
        }
      );
    });
  }

  async function sendMessage(userText) {
    chatInput.value = '';
    chatInput.disabled = true;

    // Append user message
    appendMessage('user', userText);
    conversationHistory.push({ role: 'user', text: userText });

    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    scrollToBottom();

    try {
      const response = await fetch(`${window.MediMateConfig.BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: conversationHistory.slice(-8)
        })
      });

      removeTypingIndicator(typingIndicator);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      appendMessage('bot', data.response, data.isFallback, data.disclaimer);
      conversationHistory.push({ role: 'assistant', text: data.response });

    } catch (err) {
      console.error('Chat error:', err);
      removeTypingIndicator(typingIndicator);
      appendMessage('bot', `⚠️ Could not reach MediMate AI service (${err.message || 'Network error'}). Please make sure the backend server is running on port 5001.`, true);
    } finally {
      chatInput.disabled = false;
      chatInput.focus();
      scrollToBottom();
    }
  }

  function appendMessage(sender, text, isFallback = false, disclaimer = '') {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble message-${sender}`;

    if (sender === 'bot') {
      const fallbackBadge = isFallback ? `<span class="badge badge-warning" style="margin-left: 6px; font-size: 0.7rem;">Fallback Mode</span>` : '';
      bubble.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span class="bot-tag">MediMate AI Assistant</span>
          ${fallbackBadge}
        </div>
        <div>${formatMarkdownToHtml(text)}</div>
        ${disclaimer ? `<div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 4px;"><em>${escapeHtml(disclaimer)}</em></div>` : ''}
      `;
    } else {
      bubble.innerHTML = `<p>${escapeHtml(text)}</p>`;
    }

    chatMessages.appendChild(bubble);
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'active-typing-indicator';
    indicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 6px;">MediMate AI is thinking...</span>
    `;
    chatMessages.appendChild(indicator);
    return indicator;
  }

  function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function formatMarkdownToHtml(text) {
    if (!text) return '';
    let clean = text.replace(/\r\n/g, '\n');
    let html = escapeHtml(clean);
    html = html.replace(/^#### (.*?)$/gm, '<h4 style="margin:10px 0 4px; font-weight:700;">$1</h4>');
    html = html.replace(/^### (.*?)$/gm, '<h3 style="margin:12px 0 6px; color:var(--dark-teal); font-weight:700;">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="margin:14px 0 8px; color:var(--primary-teal); font-weight:800;">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h2 style="margin:14px 0 8px; color:var(--primary-teal); font-weight:800;">$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^-\s+(.*?)$/gm, '• $1');
    html = html.replace(/^\*\s+(.*?)$/gm, '• $1');
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }
}
