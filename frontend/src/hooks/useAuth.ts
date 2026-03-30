/**
 * useAuth — manages OAuth2 login + JWT storage + user profile.
 *
 * Flow:
 *  1. Backend redirects to `/?token=<JWT>` after OAuth success.
 *  2. This hook captures the token, strips it from the URL, stores in localStorage.
 *  3. Fetches /api/auth/me to hydrate the user profile.
 *
 * Guest mode: token is null, no profile — the game still works fully.
 */

import { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthBadge {
  id: string;
  type: string;
  awardedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  experience: number;
  totalMatches: number;
  totalPoints: number;
  unlockedSkins: string[];
  badges: AuthBadge[];
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'sugar_token';

// In all environments, the API is served at /api (proxied by Vite in dev,
// and by Caddy in production — no env var needed).
const API_BASE = '/api';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user,  setUser]  = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Step 1: resolve token (URL → localStorage) on mount ──────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      // Clean the token from the URL without reload
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', clean);
      setToken(urlToken);
    } else {
      const stored = localStorage.getItem(TOKEN_KEY);
      setToken(stored);
    }
  }, []);

  // ── Step 2: fetch user profile when token is available ───────────────────
  useEffect(() => {
    if (token === null && loading) {
      // token resolution finished with no token — loading done
      setLoading(false);
      setUser(null);
      return;
    }
    if (!token) return;

    setLoading(true);
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json() as Promise<AuthUser>;
      })
      .then((profile) => {
        setUser(profile);
        setLoading(false);
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────

  function loginWithGoogle() {
    window.location.href = `${API_BASE}/auth/google`;
  }

  function loginWithFacebook() {
    window.location.href = `${API_BASE}/auth/facebook`;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return { user, token, loading, loginWithGoogle, loginWithFacebook, logout };
}
