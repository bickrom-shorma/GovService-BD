import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../utils/api';
import './AIAssistant.css';

function AIAssistant() {
  const { language, t, translateMessage } = useLanguage();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('aiChatHistory') || '[]');
      return Array.isArray(parsed)
        ? parsed.filter((item) => item && typeof item.text === 'string' && item.sender)
        : [];
    } catch {
      return [];
    }
  });

  const chatContentRef = useRef(null);
  const idCounterRef = useRef(1);

  const nextId = () => {
    idCounterRef.current += 1;
    return idCounterRef.current;
  };

  const suggestions = t('aiSuggestions');

  useEffect(() => {
    localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTo({
        top: chatContentRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatHistory, sending]);

  const handleSend = async (text = message) => {
    const userMessage = text.trim();
    if (!userMessage || sending) return;

    setError(null);
    setConfirmReset(false);
    const userEntry = {
      id: `u-${nextId()}`,
      sender: 'user',
      text: userMessage,
    };

    const nextHistory = [...chatHistory, userEntry];
    setChatHistory(nextHistory);
    setMessage('');
    setSending(true);

    try {
      const data = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          language,
          history: chatHistory.slice(-8),
        }),
      });

      const replyText = typeof data?.reply === 'string' ? data.reply.trim() : '';
      if (!replyText) {
        setError({ raw: data?.message || '', fallbackKey: 'aiUnavailableError' });
        return;
      }

      setChatHistory((prev) => [
        ...prev,
        {
          id: `a-${nextId()}`,
          sender: 'ai',
          text: replyText,
        },
      ]);
    } catch (err) {
      setError({ raw: err?.message || '', fallbackKey: 'aiUnavailableError' });
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleNewChat = () => {
    if (chatHistory.length === 0) return;
    setConfirmReset(true);
  };

  const confirmClearChat = () => {
    setChatHistory([]);
    setMessage('');
    setError(null);
    setConfirmReset(false);
  };

  return (
    <div className="ai-assistant-page">
      <div className="ai-chat-container">

        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-header-info">
            <div className="ai-avatar">🤖</div>

            <div>
              <h3>{t('aiTitle')}</h3>
              <span>{t('aiSubtitle')}</span>
            </div>
          </div>

          <div className="ai-header-actions">
            <button
              className="ai-new-chat-button"
              onClick={handleNewChat}
              type="button"
              disabled={chatHistory.length === 0}
            >
              {t('newChat')}
            </button>

            <Link to="/" className="ai-home-button">
              {t('home')}
            </Link>
          </div>
        </div>

        {confirmReset && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between m-3 mb-0 py-2 px-3">
            <span style={{ fontSize: '13px' }}>{t('confirmNewChatMsg')}</span>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={confirmClearChat}
              >
                {t('confirmYes')}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setConfirmReset(false)}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Chat Content */}
        <div
          className="ai-chat-content"
          ref={chatContentRef}
        >
          {chatHistory.length === 0 ? (
            <>
              <div className="ai-welcome">
                <div className="ai-welcome-icon">🤖</div>

                <h2>{t('aiWelcomeTitle')}</h2>

                <p>{t('aiWelcomeDesc')}</p>
              </div>

              <div className="ai-suggestions">
                <h4>{t('suggestedQuestions')}</h4>

                <div className="suggestion-list">
                  {suggestions.map((item, index) => (
                    <button
                      key={index}
                      className="suggestion-button"
                      onClick={() => handleSend(item)}
                      type="button"
                      disabled={sending}
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

                  <div className="chat-message-text" style={{ whiteSpace: 'pre-wrap' }}>
                    {chat.text}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="chat-message ai">
                  <div className="chat-message-avatar">🤖</div>
                  <div className="chat-message-text text-muted">
                    {t('aiThinking')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-danger mx-4 my-2 py-2 px-3" style={{ fontSize: '13px' }}>
            {translateMessage(error.raw, error.fallbackKey)}
          </div>
        )}

        {/* Message Input */}
        <form
          className="ai-input-area"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            placeholder={t('askPlaceholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!message.trim() || sending}
          >
            {sending ? t('sending') : t('send')}
          </button>
        </form>

        <p className="ai-footer-note">
          {t('aiFooterNote')}
        </p>

      </div>
    </div>
  );
}

export default AIAssistant;
