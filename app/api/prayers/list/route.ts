// app/api/prayers/list/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/prayers/list
 * Returns a list of all available prayer IDs and their titles
 */
export async function GET() {
  try {
    const prayersDir = path.join(process.cwd(), 'prayer-data-private');
    
    if (!fs.existsSync(prayersDir)) {
      return NextResponse.json({ prayers: [] }, { status: 200 });
    }

    const files = fs.readdirSync(prayersDir);
    const prayers: Array<{ id: string; title: string }> = [];

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('prayers.json')) {
        try {
          const filePath = path.join(prayersDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const jsonData = JSON.parse(fileContent);
          
          // Prayer files are stored directly as the prayer data object
          // The prayer-id is in the 'prayer-id' field
          if (jsonData['prayer-id']) {
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

    // Sort by ID
    prayers.sort((a, b) => a.id.localeCompare(b.id));

    return NextResponse.json({ prayers }, { status: 200 });
  } catch (error) {
    console.error('Error listing prayers:', error);
    return NextResponse.json(
      { error: 'Failed to list prayers' },
      { status: 500 }
    );
  }
}

