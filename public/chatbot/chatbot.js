(function () {
  function createChatbot() {
    if (document.getElementById('bba-chatbot-root')) return;

    const root = document.createElement('div');
    root.id = 'bba-chatbot-root';

    root.innerHTML = `
      <div class="bba-chatbot-panel" aria-live="polite" aria-label="AI Assistant chat panel">
        <div class="bba-chatbot-header">AI Assistant · Build By Alistar</div>
        <div class="bba-chatbot-messages" id="bba-chatbot-messages"></div>
        <form class="bba-chatbot-form" id="bba-chatbot-form">
          <input class="bba-chatbot-input" id="bba-chatbot-input" type="text" placeholder="Type your message..." autocomplete="off" required />
          <button class="bba-chatbot-send" type="submit">Send</button>
        </form>
      </div>
      <button class="bba-chatbot-toggle" id="bba-chatbot-toggle" type="button" aria-label="Toggle AI chatbot" aria-expanded="false">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    `;

    document.body.appendChild(root);

    const toggleButton = document.getElementById('bba-chatbot-toggle');
    const form = document.getElementById('bba-chatbot-form');
    const input = document.getElementById('bba-chatbot-input');
    const messages = document.getElementById('bba-chatbot-messages');
    const sendButton = form.querySelector('button[type="submit"]');

    let typingElement = null;

    function appendMessage(text, type) {
      const message = document.createElement('div');
      message.className = `bba-chatbot-message ${type}`;
      message.textContent = text;
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
      return message;
    }

    function setLoading(loading) {
      input.disabled = loading;
      sendButton.disabled = loading;

      if (loading) {
        typingElement = appendMessage('AI Assistant is typing…', 'assistant typing');
      } else if (typingElement) {
        typingElement.remove();
        typingElement = null;
      }
    }

    function openChatbot() {
      root.classList.add('open');
      toggleButton.setAttribute('aria-expanded', 'true');
      input.focus();
    }

    function closeChatbot() {
      root.classList.remove('open');
      toggleButton.setAttribute('aria-expanded', 'false');
    }

    toggleButton.addEventListener('click', function () {
      if (root.classList.contains('open')) {
        closeChatbot();
      } else {
        openChatbot();
      }
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const userMessage = input.value.trim();
      if (!userMessage) return;

      appendMessage(userMessage, 'user');
      input.value = '';
      setLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage })
        });

        if (!response.ok) {
          throw new Error('Chat request failed');
        }

        const data = await response.json();
        appendMessage(data.reply || 'Sorry, I did not get a response.', 'assistant');
      } catch (error) {
        appendMessage('Sorry, there was a problem connecting to the AI assistant. Please try again.', 'assistant');
      } finally {
        setLoading(false);
        input.focus();
      }
    });

    appendMessage('Hi! I\'m your AI Assistant. Ask me anything about Build By Alistar services.', 'assistant');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatbot);
  } else {
    createChatbot();
  }
})();
