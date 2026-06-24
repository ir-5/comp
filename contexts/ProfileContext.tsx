import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { todayStr } from '@/lib/utils';

export type Gender = 'male' | 'female' | 'other' | null;

export interface UserProfile {
  gender: Gender;
  birthday: string | null;       // YYYY-MM-DD
  birthdayProExpiry: string | null; // ISO date string
  profileSetup: boolean;
  // Editable account fields (local-first; email may mirror Clerk when signed in)
  displayName: string;
  username: string;
  email: string;
  phone: string;
  avatar: string; // dataURL or '' 
}

const DEFAULT_PROFILE: UserProfile = {
  gender: null,
  birthday: null,
  birthdayProExpiry: null,
  profileSetup: false,
  displayName: '',
  username: '',
  email: '',
  phone: '',
  avatar: '',
};

interface ProfileContextValue {
  profile: UserProfile;
  setProfile: (p: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  isBirthday: boolean;
  birthdayProActive: boolean;
  proLabel: (lang?: string) => string;
  moodQuestion: (lang?: string) => string;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: DEFAULT_PROFILE,
  setProfile: () => {},
  isBirthday: false,
  birthdayProActive: false,
  proLabel: () => 'Cool Pro',
  moodQuestion: () => 'How are you feeling today?',
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useLocalStorage<UserProfile>('companion_profile', DEFAULT_PROFILE);
  const [isPro, setIsPro] = useLocalStorage<boolean>('companion_is_pro', false);

  const isBirthday = (() => {
    if (!profile.birthday) return false;
    const today = new Date();
    const bday = new Date(profile.birthday);
    return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
  })();

  const birthdayProActive = (() => {
    if (!profile.birthdayProExpiry) return false;
    return new Date() < new Date(profile.birthdayProExpiry);
  })();

  // Auto-grant birthday Pro
  useEffect(() => {
    if (isBirthday && !isPro && !profile.birthdayProExpiry) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);
      setProfile(prev => ({ ...prev, birthdayProExpiry: expiry.toISOString() }));
      setIsPro(true);
    }
    // Auto-revoke birthday Pro after expiry
    if (profile.birthdayProExpiry && !birthdayProActive && isPro) {
      // Only revoke if it was a birthday grant (we can't perfectly distinguish, so check expiry)
      // We just revoke the Pro — they'll see the popup from Home
      setIsPro(false);
    }
  }, [isBirthday, isPro, profile.birthdayProExpiry, birthdayProActive]);

  const proLabel = (lang = 'en') => {
    if (profile.gender === 'male') return lang === 'ar' ? 'كينج برو' : 'King Pro';
    if (profile.gender === 'female') return lang === 'ar' ? 'كوين برو' : 'Queen Pro';
    return lang === 'ar' ? 'كول برو' : 'Cool Pro';
  };

  const moodQuestion = (lang = 'en') => {
    if (lang === 'ar') {
      if (profile.gender === 'female') return 'شلون تحسين اليوم؟';
      if (profile.gender === 'male') return 'شلون تحس اليوم؟';
      return 'شلون تحس اليوم؟';
    }
    return 'How are you feeling today?';
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile, isBirthday, birthdayProActive, proLabel, moodQuestion }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
