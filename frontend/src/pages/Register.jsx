import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Register.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { t, translateMessage } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError({ key: 'invalidEmail' });
      return;
    }

    if (form.password.length < 8) {
      setError({ key: 'passwordMinLength' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError({ key: 'passwordMismatch' });
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate('/profile', { replace: true });
    } catch (err) {
      setError({ raw: err.message, fallbackKey: 'registerFailedError' });
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
      <div className="auth-card register-card">
        <h2>{t('registerTitle')}</h2>
        <p>{t('registerSubtitle')}</p>

        {errorText && (
          <div className="alert alert-danger py-2 px-3 mb-3" role="alert">
            {errorText}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="reg-name">{t('fullNameLabel')}</label>
            <input
              id="reg-name"
              name="full_name"
              type="text"
              placeholder={t('fullNamePlaceholder')}
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="reg-email">{t('emailLabel')}</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="reg-phone">{t('phoneLabel')}</label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              placeholder={t('phonePlaceholder')}
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="reg-password">{t('passwordLabel')}</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder={t('createPasswordPlaceholder')}
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="reg-confirm">{t('confirmPasswordLabel')}</label>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              placeholder={t('confirmPasswordPlaceholder')}
              value={form.confirmPassword}
              onChange={handleChange}
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={submitting}>
            {submitting ? t('creatingAccount') : t('createAccountBtn')}
          </button>
        </form>

        <p className="auth-switch">
          {t('haveAccount')} <Link to="/login">{t('loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
