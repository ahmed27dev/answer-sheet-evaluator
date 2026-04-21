import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Answer Sheet Evaluator
      </Link>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/questions">Question Bank</Link>
        <Link to="/evaluate">Evaluate</Link>
        <Link to="/history">History</Link>

        {user && (
          <>
            <span
              style={{
                color: 'rgba(255,255,255,0.4)',
                marginLeft: '24px',
                fontSize: '0.88rem',
              }}
            >
              {user}
            </span>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: '16px',
                background: 'transparent',
                border: '1px solid rgba(233,69,96,0.5)',
                color: '#e94560',
                padding: '5px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e94560';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#e94560';
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
