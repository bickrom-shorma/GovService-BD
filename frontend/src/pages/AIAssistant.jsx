
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './AIAssistant.css';

function AIAssistant() {
  const [message, setMessage] = useState('');

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('aiChatHistory') || '[]'
      );
    } catch {
      return [];
    }
  });

  const chatContentRef = useRef(null);

  const suggestions = [
    'How can I apply for a new NID?',
    'What documents are required for a passport?',
    'How can I register a birth certificate?',
    'What is the driving licence application process?',
  ];

  // Save chat history
  useEffect(() => {
    localStorage.setItem(
      'aiChatHistory',
      JSON.stringify(chatHistory)
    );
  }, [chatHistory]);

  // Automatically scroll to latest message
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTo({
        top: chatContentRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatHistory]);

  // Send message
  const handleSend = (text = message) => {
    const userMessage = text.trim();

    if (!userMessage) return;

    const timestamp = Date.now();

    const newMessages = [
      ...chatHistory,
      {
        id: timestamp,
        sender: 'user',
        text: userMessage,
      },
      {
        id: timestamp + 1,
        sender: 'ai',
        text:
          'Thank you for your question! AI responses will be available after connecting the AI backend. Please verify important government service information with official sources.',
      },
    ];

    setChatHistory(newMessages);
    setMessage('');
  };

  // Submit message
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  // Start new chat
  const handleNewChat = () => {
    if (chatHistory.length === 0) return;

    const confirmNewChat = window.confirm(
      'Are you sure you want to start a new chat? Your current conversation will be deleted.'
    );

    if (confirmNewChat) {
      setChatHistory([]);
      setMessage('');
    }
  };

  return (
    <div className="ai-assistant-page">
      <div className="ai-chat-container">

        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-header-info">
            <div className="ai-avatar">🤖</div>

            <div>
              <h3>GovService AI Assistant</h3>
              <span>Government Service Help Center</span>
            </div>
          </div>

          <div className="ai-header-actions">
            <button
              className="ai-new-chat-button"
              onClick={handleNewChat}
              type="button"
            >
              + New Chat
            </button>

            <Link to="/" className="ai-home-button">
              Home
            </Link>
          </div>
        </div>

        {/* Chat Content */}
        <div
          className="ai-chat-content"
          ref={chatContentRef}
        >
          {chatHistory.length === 0 ? (
            <>
              <div className="ai-welcome">
                <div className="ai-welcome-icon">🤖</div>

                <h2>How can I help you today?</h2>

                <p>
                  Ask me anything about Bangladesh government
                  services, required documents, application
                  procedures, fees and other information.
                </p>
              </div>

              <div className="ai-suggestions">
                <h4>Suggested Questions</h4>

                <div className="suggestion-list">
                  {suggestions.map((item, index) => (
                    <button
                      key={index}
                      className="suggestion-button"
                      onClick={() => handleSend(item)}
                      type="button"
                    >
                      {item}
                      <span>→</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="chat-history">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-message ${chat.sender}`}
                >
                  <div className="chat-message-avatar">
                    {chat.sender === 'user' ? '👤' : '🤖'}
                  </div>

                  <div className="chat-message-text">
                    {chat.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <form
          className="ai-input-area"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            placeholder="Ask your question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="submit"
            disabled={!message.trim()}
          >
            Send
          </button>
        </form>

        <p className="ai-footer-note">
          AI responses are currently in demo mode.
          Please verify important information with official sources.
        </p>

      </div>
    </div>
  );
}

export default AIAssistant;
