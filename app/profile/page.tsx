'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
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

export default function MyProfilePage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      // publicMetadata is accessible from client-side useUser() hook
      const publicMetadata = user.publicMetadata as any || {};
      const userProfile: UserProfile = {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses[0]?.emailAddress || '',
        imageUrl: user.imageUrl,
        jewishLearningProfile: {
          gender: publicMetadata?.gender || undefined,
          nusach: publicMetadata?.nusach || 'Ashkenaz',
          hebrewName: publicMetadata?.hebrewName || '',
          learningLevel: publicMetadata?.learningLevel || 'beginner',
          preferredLanguage: publicMetadata?.preferredLanguage || 'both',
          includeTransliteration: publicMetadata?.includeTransliteration ?? true,
          includeEnglishTranslation: publicMetadata?.includeEnglishTranslation ?? true,
          customPrayers: publicMetadata?.customPrayers || [],
          notes: publicMetadata?.notes || '',
          wordMappingInterval: publicMetadata?.wordMappingInterval ?? 1,
          wordMappingStartIndex: publicMetadata?.wordMappingStartIndex ?? 0,
          showWordMappingSubscripts: publicMetadata?.showWordMappingSubscripts ?? true,
          includeIntroduction: publicMetadata?.includeIntroduction ?? true,
          includeInstructions: publicMetadata?.includeInstructions ?? true,
          fontSizeMultiplier: publicMetadata?.fontSizeMultiplier ?? 1.0,
          pageMargins: publicMetadata?.pageMargins || 'normal',
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
        // Reload user data to get updated publicMetadata
        await user.reload();
        const publicMetadata = user.publicMetadata as any || {};
        setProfile({
          ...profile!,
          jewishLearningProfile: {
            gender: publicMetadata?.gender || undefined,
            nusach: publicMetadata?.nusach || 'Ashkenaz',
            hebrewName: publicMetadata?.hebrewName || '',
            learningLevel: publicMetadata?.learningLevel || 'beginner',
            preferredLanguage: publicMetadata?.preferredLanguage || 'both',
            includeTransliteration: publicMetadata?.includeTransliteration ?? true,
            includeEnglishTranslation: publicMetadata?.includeEnglishTranslation ?? true,
            customPrayers: publicMetadata?.customPrayers || [],
            notes: publicMetadata?.notes || '',
            wordMappingInterval: publicMetadata?.wordMappingInterval ?? 1,
            wordMappingStartIndex: publicMetadata?.wordMappingStartIndex ?? 0,
            showWordMappingSubscripts: publicMetadata?.showWordMappingSubscripts ?? true,
            includeIntroduction: publicMetadata?.includeIntroduction ?? true,
            includeInstructions: publicMetadata?.includeInstructions ?? true,
            fontSizeMultiplier: publicMetadata?.fontSizeMultiplier ?? 1.0,
            pageMargins: publicMetadata?.pageMargins || 'normal',
          },
        });
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
                    checked={profile.jewishLearningProfile?.includeEnglishTranslation ?? true}
                    onChange={(e) => handleJewishLearningChange('includeEnglishTranslation', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-white">{profile.jewishLearningProfile?.includeEnglishTranslation !== false ? 'Yes' : 'No'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Siddur Generation Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">Siddur Generation Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Word Mapping Interval
                  <span className="text-xs text-gray-500 ml-2">(Map every N words, e.g., 1 = every word, 5 = every 5th word)</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    value={profile.jewishLearningProfile?.wordMappingInterval || 1}
                    onChange={(e) => handleJewishLearningChange('wordMappingInterval', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{profile.jewishLearningProfile?.wordMappingInterval || 1}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Word Mapping Start Index
                  <span className="text-xs text-gray-500 ml-2">(Start mapping from which word index, 0 = first word)</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={profile.jewishLearningProfile?.wordMappingStartIndex || 0}
                    onChange={(e) => handleJewishLearningChange('wordMappingStartIndex', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{profile.jewishLearningProfile?.wordMappingStartIndex || 0}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Show Word Mapping Subscripts</label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={profile.jewishLearningProfile?.showWordMappingSubscripts !== false}
                    onChange={(e) => handleJewishLearningChange('showWordMappingSubscripts', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-white">{profile.jewishLearningProfile?.showWordMappingSubscripts !== false ? 'Yes' : 'No'}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Include Introduction Text</label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={profile.jewishLearningProfile?.includeIntroduction !== false}
                    onChange={(e) => handleJewishLearningChange('includeIntroduction', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-white">{profile.jewishLearningProfile?.includeIntroduction !== false ? 'Yes' : 'No'}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Include Instruction Text</label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={profile.jewishLearningProfile?.includeInstructions !== false}
                    onChange={(e) => handleJewishLearningChange('includeInstructions', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                ) : (
                  <span className="text-white">{profile.jewishLearningProfile?.includeInstructions !== false ? 'Yes' : 'No'}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Font Size Multiplier
                  <span className="text-xs text-gray-500 ml-2">(Scale all fonts, e.g., 1.0 = normal, 1.2 = 20% larger)</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={profile.jewishLearningProfile?.fontSizeMultiplier || 1.0}
                    onChange={(e) => handleJewishLearningChange('fontSizeMultiplier', parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-white">{profile.jewishLearningProfile?.fontSizeMultiplier || 1.0}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Page Margins</label>
                {isEditing ? (
                  <select
                    value={profile.jewishLearningProfile?.pageMargins || 'normal'}
                    onChange={(e) => handleJewishLearningChange('pageMargins', e.target.value as 'tight' | 'normal' | 'wide')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tight">Tight</option>
                    <option value="normal">Normal</option>
                    <option value="wide">Wide</option>
                  </select>
                ) : (
                  <p className="text-white capitalize">{profile.jewishLearningProfile?.pageMargins || 'Normal'}</p>
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
