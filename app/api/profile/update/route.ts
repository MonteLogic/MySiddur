import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs';
import { Nusach } from '@mysiddur/types';
// import { Nusach } from '@mysiddur/types';
// import { Nusach } from '#/lib/siddur/types/siddurTypes';
// Nusach




interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  gender?: 'man' | 'woman';
  nusach?: Nusach;
  hebrewName?: string;
  learningLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage?: 'hebrew' | 'english' | 'both';
  includeTransliteration?: boolean;
  includeEnglishTranslation?: boolean;
  customPrayers?: string[];
  notes?: string;
  // Siddur Generation Settings
  wordMappingInterval?: number;
  wordMappingStartIndex?: number;
  showWordMappingSubscripts?: boolean;
  includeIntroduction?: boolean;
  includeInstructions?: boolean;
  fontSizeMultiplier?: number;
  pageMargins?: 'tight' | 'normal' | 'wide';
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const updateData: ProfileUpdateData = await request.json();

    // Get current user to access existing metadata
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata || {};

    // Prepare the updated metadata
    const updatedMetadata = {
      ...currentMetadata,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Update user with new metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata,
    });

    // Also update basic user info if provided
    const basicUserUpdate: Pick<ProfileUpdateData, 'firstName' | 'lastName'> = {};
    if (updateData.firstName !== undefined) {
      basicUserUpdate.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      basicUserUpdate.lastName = updateData.lastName;
    }

    if (Object.keys(basicUserUpdate).length > 0) {
      await clerkClient.users.updateUser(userId, basicUserUpdate);
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      data: updateData,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
