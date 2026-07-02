'use client';

import { account } from '@/lib/appwrite/client';

/** Wraps fetch, attaching a short-lived Appwrite JWT so our API routes can identify the caller. */
export async function authedFetch(url: string, init: RequestInit = {}) {
  const jwt = await account.createJWT();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${jwt.jwt}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}
