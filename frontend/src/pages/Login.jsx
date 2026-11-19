import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { t, translateMessage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError({ key: 'loginRequiredError' });
      return;
    }

    setSubmitting(true);
    try {
      const data = await login(trimmedEmail, password);
      const from = location.state?.from;
      if (from) {
        navigate(from, { replace: true });
      } else if (data?.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      setError({ raw: err.message, fallbackKey: 'loginFailedError' });
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = error
    ? error.key
      ? t(error.key)
      : translateMessage(error.raw, error.fallbackKey)
    : '';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('loginTitle')}</h2>
        <p>{t('loginSubtitle')}</p>

        {errorText && (
          <div className="alert alert-danger py-2 px-3 mb-3" role="alert">
            {errorText}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="login-email">{t('emailLabel')}</label>
            <input
              id="login-email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="login-password">{t('passwordLabel')}</label>
            <input
              id="login-password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={submitting}>
            {submitting ? t('loggingIn') : t('loginBtn')}
          </button>
        </form>

        <p className="auth-switch">
          {t('noAccount')} <Link to="/register">{t('registerLink')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
