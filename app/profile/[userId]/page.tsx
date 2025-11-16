'use client';

import { useState, useEffect } from 'react';
import { useUser } from '#/lib/safe-clerk-hooks';
import { UserButton } from '@clerk/nextjs';
import { Nusach } from '#/lib/siddur/types/siddurTypes';
import { JewishLearningProfile } from '#/types/UserTypes';

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  imageUrl?: string;
  jewishLearningProfile?: JewishLearningProfile;
}

export default function MyProfilePage({ params }: { params: { userId: string } }) {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      const userWithMetadata = user as any; // Type assertion for privateMetadata
      const privateMetadata = userWithMetadata.privateMetadata;
      const userProfile: UserProfile = {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses[0]?.emailAddress || '',
        imageUrl: user.imageUrl,
        jewishLearningProfile: {
          gender: privateMetadata?.gender || undefined,
          nusach: privateMetadata?.nusach || 'Ashkenaz',
          hebrewName: privateMetadata?.hebrewName || '',
          learningLevel: privateMetadata?.learningLevel || 'beginner',
          preferredLanguage: privateMetadata?.preferredLanguage || 'both',
          includeTransliteration: privateMetadata?.includeTransliteration ?? true,
          includeEnglishTranslation: privateMetadata?.includeEnglishTranslation ?? true,
          customPrayers: privateMetadata?.customPrayers || [],
          notes: privateMetadata?.notes || '',
        },
      };
      setProfile(userProfile);
      setIsLoading(false);
    } else if (isLoaded && !user) {
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  const handleSave = async () => {
    if (!profile || !profile.jewishLearningProfile) return;

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          ...profile.jewishLearningProfile,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        // Show success message
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  const handleJewishLearningChange = (field: keyof JewishLearningProfile, value: any) => {
    if (profile && profile.jewishLearningProfile) {
      setProfile({
        ...profile,
        jewishLearningProfile: {
          ...profile.jewishLearningProfile,
          [field]: value,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Error loading profile. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <p className="text-gray-400 mt-2">Manage your personal information and Jewish learning preferences</p>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <img
                    src={profile.imageUrl || '/default-avatar.png'}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <p className="text-sm text-gray-400">Profile picture managed by Clerk</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{profile.firstName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{profile.lastName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <p className="text-white">{profile.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hebrew Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.jewishLearningProfile?.hebrewName || ''}
                    onChange={(e) => handleJewishLearningChange('hebrewName', e.target.value)}
                    placeholder="Enter your Hebrew name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{profile.jewishLearningProfile?.hebrewName || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Jewish Learning Preferences */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">Jewish Learning Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                {isEditing ? (
                  <select
                    value={profile.jewishLearningProfile?.gender || ''}
                    onChange={(e) => handleJewishLearningChange('gender', e.target.value || undefined)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="man">Man</option>
                    <option value="woman">Woman</option>
                  </select>
                ) : (
                  <p className="text-white">{profile.jewishLearningProfile?.gender ? profile.jewishLearningProfile.gender.charAt(0).toUpperCase() + profile.jewishLearningProfile.gender.slice(1) : 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nusach (Prayer Tradition)</label>
                {isEditing ? (
                  <select
                    value={profile.jewishLearningProfile?.nusach || 'Ashkenaz'}
                    onChange={(e) => handleJewishLearningChange('nusach', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ashkenaz">Ashkenaz</option>
                    <option value="Sefard">Sefard</option>
                    <option value="EdotHaMizrach">Edot HaMizrach</option>
                  </select>
                ) : (
                  <p className="text-white">{profile.jewishLearningProfile?.nusach || 'Ashkenaz'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Learning Level</label>
                {isEditing ? (
                  <select
                    value={profile.jewishLearningProfile?.learningLevel || 'beginner'}
                    onChange={(e) => handleJewishLearningChange('learningLevel', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                ) : (
                  <p className="text-white">{profile.jewishLearningProfile?.learningLevel ? profile.jewishLearningProfile.learningLevel.charAt(0).toUpperCase() + profile.jewishLearningProfile.learningLevel.slice(1) : 'Beginner'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Language</label>
                {isEditing ? (
                  <select
                    value={profile.jewishLearningProfile?.preferredLanguage || 'both'}
                    onChange={(e) => handleJewishLearningChange('preferredLanguage', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hebrew">Hebrew Only</option>
                    <option value="english">English Only</option>
                    <option value="both">Both Hebrew and English</option>
                  </select>
                ) : (
                  <p className="text-white">{profile.jewishLearningProfile?.preferredLanguage ? profile.jewishLearningProfile.preferredLanguage.charAt(0).toUpperCase() + profile.jewishLearningProfile.preferredLanguage.slice(1) : 'Both'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Siddur Preferences */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">Siddur Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Include Transliteration</label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={profile.jewishLearningProfile?.includeTransliteration || false}
                    onChange={(e) => handleJewishLearningChange('includeTransliteration', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-white">{profile.jewishLearningProfile?.includeTransliteration ? 'Yes' : 'No'}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Include English Translation</label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={profile.jewishLearningProfile?.includeEnglishTranslation || false}
                    onChange={(e) => handleJewishLearningChange('includeEnglishTranslation', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-white">{profile.jewishLearningProfile?.includeEnglishTranslation ? 'Yes' : 'No'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">Additional Notes</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Personal Notes</label>
              {isEditing ? (
                <textarea
                  value={profile.jewishLearningProfile?.notes || ''}
                  onChange={(e) => handleJewishLearningChange('notes', e.target.value)}
                  placeholder="Add any personal notes about your learning preferences..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-white whitespace-pre-wrap">{profile.jewishLearningProfile?.notes || 'No notes added'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Custom Prayers Section */}
        {isEditing && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-400">Custom Prayers</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add Custom Prayers (one per line)
                </label>
                <textarea
                  value={profile.jewishLearningProfile?.customPrayers?.join('\n') || ''}
                  onChange={(e) => handleJewishLearningChange('customPrayers', e.target.value.split('\n').filter(p => p.trim()))}
                  placeholder="Enter custom prayers, one per line..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
