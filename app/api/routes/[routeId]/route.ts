import { ClerkMetadataService } from '@mysiddur/core';
import { NextRequest, NextResponse } from 'next/server';
// import { ClerkMetadataService } from '#/lib/clerk-metadata-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { routeId: string } },
) {
  const { routeId } = params;

  // Check if the conversion was successful
  if (!routeId) {
    return NextResponse.json({ error: 'Invalid route ID' }, { status: 400 });
  }

  try {
    // Get organization ID from the request or headers
    // You may need to adjust this based on how you pass the organization ID
    const organizationID = request.headers.get('x-organization-id');
    
    if (!organizationID) {
      return NextResponse.json({ error: 'Organization ID not provided' }, { status: 400 });
    }

    const success = await ClerkMetadataService.deleteRoute(organizationID, routeId);

    if (!success) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Route deleted successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 },
    );
  }
}