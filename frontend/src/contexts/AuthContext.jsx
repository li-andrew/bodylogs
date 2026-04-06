import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem('is_premium') === 'true');

  function login(newToken, is_premium = false) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('is_premium', String(is_premium));
    setToken(newToken);
    setIsPremium(is_premium);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('is_premium');
    setToken(null);
    setIsPremium(false);
  }

  return (
    <AuthContext.Provider value={{ token, isPremium, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
