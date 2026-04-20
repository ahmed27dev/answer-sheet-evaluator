import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// ── Hardcoded teacher credentials (demo) ──
const VALID_USERS = [
  { username: 'teacher', password: 'teacher123' },
  { username: 'admin', password: 'admin123' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => sessionStorage.getItem('teacher_user') || null,
  );

  const login = (username, password) => {
    const match = VALID_USERS.find(
      (u) => u.username === username && u.password === password,
    );
    if (match) {
      sessionStorage.setItem('teacher_user', match.username);
      setUser(match.username);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('teacher_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
