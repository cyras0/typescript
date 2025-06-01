import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN, // You'll need to add this to your .env file
  useCdn: false, // Always false for write operations
})