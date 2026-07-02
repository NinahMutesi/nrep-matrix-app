import 'server-only';
import { Client, Databases, Storage, Teams, Users } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const apiKey = process.env.APPWRITE_API_KEY!;

export function getAdminClient() {
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
    teams: new Teams(client),
    users: new Users(client),
  };
}
