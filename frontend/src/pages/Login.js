import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }
    const ok = login(username.trim(), password);
    if (ok) {
      navigate('/');
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '400px',
          border: '0.5px solid #e0e0e0',
        }}
      >
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: '#1a1a2e',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e94560"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1a1a2e',
              marginBottom: '4px',
            }}
          >
            Answer Sheet Evaluator
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>
            Sign in to continue
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#fff0f0',
              color: '#c0392b',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              borderLeft: '3px solid #e74c3c',
            }}
          >
            {error}
          </div>
        )}

        {/* Fields */}
        <label
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#555',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Username
        </label>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fafafa',
          }}
        />

        <label
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#555',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Password
        </label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '24px',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fafafa',
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            background: '#e94560',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>

        {/* Demo hint */}
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#888',
            textAlign: 'center',
          }}
        >
          Demo credentials: <strong>teacher</strong> /{' '}
          <strong>teacher123</strong>
        </div>
      </div>
    </div>
  );
}

export default Login;
