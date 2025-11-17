// app/api/prayers/[prayerId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/prayers/[prayerId]
 * Returns the full prayer data for a given prayer ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { prayerId: string } }
) {
  try {
    const { prayerId } = params;
    const filePath = path.join(process.cwd(), 'prayer-data-private', `${prayerId}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Prayer not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // Prayer files are stored directly as the prayer data object
    // Return it wrapped in the prayer-id key for consistency
    const prayerId = jsonData['prayer-id'] || params.prayerId;
    return NextResponse.json({ [prayerId]: jsonData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching prayer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayer' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/prayers/[prayerId]
 * Updates the prayer data for a given prayer ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { prayerId: string } }
) {
  try {
    const { prayerId } = params;
    const body = await request.json();

    // Body can come in two formats:
    // 1. Wrapped: { [prayerId]: { prayer data } }
    // 2. Direct: { prayer data }
    let prayerData: any;
    if (body[prayerId]) {
      prayerData = body[prayerId];
    } else if (body['prayer-id']) {
      prayerData = body;
    } else {
      return NextResponse.json(
        { error: 'Invalid prayer data format' },
        { status: 400 }
      );
    }

    // Validate prayer-id matches
    if (prayerData['prayer-id'] !== prayerId) {
      return NextResponse.json(
        { error: 'Prayer ID mismatch' },
        { status: 400 }
      );
    }

    // Update the date_modified field
    prayerData.date_modified = new Date().toISOString();

    const filePath = path.join(process.cwd(), 'prayer-data-private', `${prayerId}.json`);
    
    // Write the prayer data directly (not wrapped)
    fs.writeFileSync(filePath, JSON.stringify(prayerData, null, 2), 'utf-8');

    return NextResponse.json({ success: true, prayer: prayerData }, { status: 200 });
  } catch (error) {
    console.error('Error updating prayer:', error);
    return NextResponse.json(
      { error: 'Failed to update prayer' },
      { status: 500 }
    );
  }
}

