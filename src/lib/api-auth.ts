import 'server-only';
import { Client, Account } from 'node-appwrite';
import { Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import type { Profile } from '@/types';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export class ApiAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Validates the Bearer JWT on a request and returns the caller's auth user + app profile. */
export async function requireUser(req: Request): Promise<{
  userId: string;
  name: string;
  email: string;
  profile: Profile;
}> {
  const auth = req.headers.get('authorization') ?? '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!jwt) throw new ApiAuthError('Missing Authorization header.');

  const jwtClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
  const jwtAccount = new Account(jwtClient);

  let authUser;
  try {
    authUser = await jwtAccount.get();
  } catch {
    throw new ApiAuthError('Invalid or expired session.');
  }

  const { databases } = getAdminClient();
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
    Query.equal('userId', authUser.$id),
    Query.limit(1),
  ]);
  const profile = res.documents[0] as unknown as Profile;
  if (!profile) throw new ApiAuthError('No profile found for this account.', 404);

  return { userId: authUser.$id, name: authUser.name, email: authUser.email, profile };
}

export function requireApproved(profile: Profile) {
  if (profile.status !== 'approved') {
    throw new ApiAuthError('Your account is awaiting approval.', 403);
  }
}

export function requireAdmin(profile: Profile) {
  if (profile.role !== 'admin' || profile.status !== 'approved') {
    throw new ApiAuthError('Administrator access required.', 403);
  }
}
