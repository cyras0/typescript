import "server-only"
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId, token } from '../env'

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false, // Always false for write operations
});

if (!writeClient.config().token) {
  throw new Error('Write token not found');
}