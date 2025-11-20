'use server';

import { auth } from '@clerk/nextjs/server';
import { list } from '@vercel/blob';

export interface UploadedPrayer {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  edit_id?: string;
  prayer_id?: string;
  prayer_title?: string;
  user_id?: string;
}

/**
 * Get list of uploaded prayers for the current user
 */
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // List all blobs from Vercel Blob storage
    const { blobs } = await list({
      token: process.env.my_siddur_1_READ_WRITE_TOKEN,
    });

    // Filter and fetch prayer data for current user
    const userPrayers: UploadedPrayer[] = [];
    
    for (const blob of blobs) {
      // Only process JSON files
      if (!blob.pathname.endsWith('.json')) continue;
      
      try {
        // Fetch the JSON content
        const response = await fetch(blob.url);
        const data = await response.json();
        
        // Only include if user_id matches or if no user_id (legacy files)
        if (data.user_id === userId) {
          userPrayers.push({
            url: blob.url,
            pathname: blob.pathname,
            size: blob.size,
            uploadedAt: blob.uploadedAt,
            edit_id: data.edit_id,
            prayer_id: data['prayer-id'],
            prayer_title: data['prayer-title'],
            user_id: data.user_id,
          });
        }
      } catch (error) {
        console.warn(`Failed to parse blob ${blob.pathname}:`, error);
      }
    }

    // Sort by upload date, newest first
    userPrayers.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return Response.json({ prayers: userPrayers });
  } catch (error) {
    console.error('Error fetching uploaded prayers:', error);
    return Response.json({ error: 'Failed to fetch uploaded prayers' }, { status: 500 });
  }
}
