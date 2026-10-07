import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hashPassword } from '../lib/db';
import { useDb } from './DbContext';

const AuthContext = createContext(null);
const SESSION_KEY = 'staytall.session.v1';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))?.userId ?? null;
  } catch {
    return null;
  }
};
const writeSession = (userId) => {
  try {
    if (userId) localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, at: Date.now() }));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* session just won't survive a reload */
  }
};

// A short pause so the UI can show its loading state — feels like a real request.
const latency = (ms = 750) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }) {
  const { db, getRef, addUser } = useDb();
  const [userId, setUserId] = useState(readSession);

  useEffect(() => {
    const onStorage = (e) => e.key === SESSION_KEY && setUserId(readSession());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const user = useMemo(() => db.users.find((u) => u.id === userId) || null, [db.users, userId]);

  const signIn = useCallback(
    async (email, password) => {
      await latency();
      const e = email.trim().toLowerCase();
      if (!EMAIL_RE.test(e)) return { ok: false, field: 'email', error: 'Enter a valid email address' };
      if (!password) return { ok: false, field: 'password', error: 'Enter your password' };
      const found = getRef().users.find((u) => u.email.toLowerCase() === e);
      if (!found) return { ok: false, field: 'email', error: 'No account uses that email — create one instead' };
      if (!found.passwordHash || found.passwordHash !== hashPassword(e, password)) {
        return { ok: false, field: 'password', error: 'That password is incorrect' };
      }
      writeSession(found.id);
      setUserId(found.id);
      return { ok: true, user: found };
    },
    [getRef]
  );

  const signUp = useCallback(
    async ({ name, email, password }) => {
      await latency(900);
      const e = email.trim().toLowerCase();
      if (name.trim().length < 2) return { ok: false, field: 'name', error: 'Tell us your name' };
      if (!EMAIL_RE.test(e)) return { ok: false, field: 'email', error: 'Enter a valid email address' };
      if (password.length < 8) return { ok: false, field: 'password', error: 'Use at least 8 characters' };
      if (getRef().users.some((u) => u.email.toLowerCase() === e)) {
        return { ok: false, field: 'email', error: 'That email already has an account — sign in instead' };
      }
      const created = {
        id: `u-${Date.now().toString(36)}`,
        name: name.trim(),
        email: e,
        role: 'customer',
        passwordHash: hashPassword(e, password),
        createdAt: Date.now(),
        address: { line1: '', city: '', country: 'NG' },
      };
      addUser(created);
      writeSession(created.id);
      setUserId(created.id);
      return { ok: true, user: created };
    },
    [getRef, addUser]
  );

  const signOut = useCallback(() => {
    writeSession(null);
    setUserId(null);
  }, []);

  const value = useMemo(() => ({ user, isAdmin: user?.role === 'admin', signIn, signUp, signOut }), [user, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const passwordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ['Too short', 'Weak', 'Okay', 'Strong', 'Unshakeable'][score] };
};
