import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login, register } from './authApi';
import { uploadFiles } from '../../lib/api';
// احراز هویت
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('motrly_user') || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('motrly_token');
    if (!token) {
      setReady(true);
      return;
    }
    getCurrentUser()
      .then(({ user: currentUser }) => {
        localStorage.setItem('motrly_user', JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem('motrly_token');
        localStorage.removeItem('motrly_user');
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const authenticate = async (data) => {
    const isRegister = Boolean(data.passwordConfirmation);
    const result = isRegister
      ? await register({
          name: data.name,
          username: data.username,
          email: data.email,
          password: data.password,
          sellerType: data.sellerType,
          companyName: data.companyName || '',
          phone: data.phone || '',
          province: data.province || '',
          city: data.city || '',
          about: data.about || '',
        })
      : await login({ identifier: data.identifier || data.email, password: data.password });

    localStorage.setItem('motrly_token', result.token);
    let nextUser = result.user;
    if (data.avatarFile) {
      const uploaded = await uploadFiles('/uploads/avatar', [data.avatarFile]);
      nextUser = uploaded.user;
    }
    localStorage.setItem('motrly_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const signOut = () => {
    localStorage.removeItem('motrly_token');
    localStorage.removeItem('motrly_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, ready, authenticate, signOut, setUser }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
