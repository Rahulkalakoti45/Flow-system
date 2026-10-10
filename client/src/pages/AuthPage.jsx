import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Shared login/register screen. `mode` is 'login' or 'register'.
 */
export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth">
      <form className="card auth__card" onSubmit={handleSubmit}>
        <h1>{isLogin ? 'Sign in to TaskFlow' : 'Create your account'}</h1>

        {!isLogin && (
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={isLogin ? undefined : 8}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
        </button>

        <p className="muted">
          {isLogin ? (
            <>No account? <Link to="/register">Register</Link></>
          ) : (
            <>Already registered? <Link to="/login">Sign in</Link></>
          )}
        </p>
      </form>
    </main>
  );
}
