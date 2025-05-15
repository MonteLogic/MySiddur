import { NextRequest, NextResponse } from 'next/server';
import { tursoClient } from '#/db/index';
import { routes } from '#/db/schema';
import { eq } from 'drizzle-orm';

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
    const db = tursoClient();
    const deletedRoutes = await db
      .delete(routes)
      .where(eq(routes.id, routeId)) // Use the number version
      .returning();

    if (deletedRoutes.length === 0) {
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
