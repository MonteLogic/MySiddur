'use server';

import fs from 'fs';
import path from 'path';

import { put } from '@vercel/blob';

export interface Prayer {
  id: string;
  title: string;
}

export interface WordMapping {
  hebrew: string;
  english: string;
  transliteration: string;
  'detailed-array': Array<[number, number | number[]]>;
}

export interface PrayerData {
  'prayer-title': string;
  version: string;
  date_modified: string;
  Introduction?: string;
  Instruction?: string;
  'prayer-id': string;
  'link-to-prayer'?: string;
  edit_id?: string;
  'Word Mappings': {
    [key: string]: WordMapping;
  };
}

/**
 * Get list of all available prayers
 */
export async function getPrayersList(): Promise<Prayer[]> {
  try {
    const prayersDir = path.join(process.cwd(), 'prayer-data-private');
    
    if (!fs.existsSync(prayersDir)) {
      return [];
    }

    const files = fs.readdirSync(prayersDir);
    const prayers: Prayer[] = [];
    const seenIds = new Set<string>();

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('prayers.json')) {
        try {
          const filePath = path.join(prayersDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const jsonData = JSON.parse(fileContent);
          
          if (jsonData['prayer-id'] && !seenIds.has(jsonData['prayer-id'])) {
            seenIds.add(jsonData['prayer-id']);
            prayers.push({
              id: jsonData['prayer-id'],
              title: jsonData['prayer-title'] || jsonData['prayer-id'],
            });
          }
        } catch (error) {
          console.warn(`Failed to parse prayer file ${file}:`, error);
        }
      }
    }

    prayers.sort((a, b) => a.id.localeCompare(b.id));
    return prayers;
  } catch (error) {
    console.error('Error listing prayers:', error);
    return [];
  }
}

/**
 * Get prayer data by ID
 */
export async function getPrayerData(prayerId: string): Promise<PrayerData | null> {
  try {
    const filePath = path.join(process.cwd(), 'prayer-data-private', `${prayerId}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    return jsonData;
  } catch (error) {
    console.error('Error fetching prayer:', error);
    return null;
  }
}

/**
 * Save prayer data
 */
export async function savePrayerData(prayerId: string, prayerData: PrayerData): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    // Validate prayer-id matches
    if (prayerData['prayer-id'] !== prayerId) {
      return { success: false, error: 'Prayer ID mismatch' };
    }

    // Update the date_modified field
    prayerData.date_modified = new Date().toISOString();
    
    // Generate a random edit_id
    prayerData.edit_id = crypto.randomUUID();

    // Upload to Vercel Blob
    const filename = `${prayerId}-${prayerData.edit_id}.json`;
    const { url } = await put(filename, JSON.stringify(prayerData, null, 2), {
      access: 'public',
      addRandomSuffix: false, // We already have a unique ID
    });

    console.log(`Prayer saved to Blob: ${url}`);

    return { success: true, url };
  } catch (error) {
    console.error('Error updating prayer:', error);
    return { success: false, error: 'Failed to update prayer' };
  }
}

