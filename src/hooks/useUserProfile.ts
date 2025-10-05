import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

// Simple global event name for cross-component profile updates
const PROFILE_UPDATED_EVENT = 'fynance:profile-updated';

// Simple in-memory cache to avoid refetching on every mount/route change
let cachedProfile: UserProfile | null = null;
let lastFetchedAt: number | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (force: boolean = false) => {
    if (!user?.id) return;

    // Serve from cache when valid and not forcing
    const now = Date.now();
    const isCacheValid = cachedProfile && lastFetchedAt && now - lastFetchedAt < CACHE_TTL_MS;
    if (!force && isCacheValid) {
      setProfile(cachedProfile);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      const profileData = data || { full_name: null, avatar_url: null };
      setProfile(profileData);
      cachedProfile = profileData;
      lastFetchedAt = Date.now();
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Erro ao carregar perfil');
      const emptyProfile = { full_name: null, avatar_url: null };
      setProfile(emptyProfile);
      cachedProfile = emptyProfile;
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (fullName?: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: fullName || user.user_metadata?.full_name || null,
          avatar_url: null,
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      cachedProfile = data;
      lastFetchedAt = Date.now();
      // notify listeners profile was created and bypass cache on listeners
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
      return data;
    } catch (err: any) {
      console.error('Error creating user profile:', err);
      setError(err.message || 'Erro ao criar perfil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // First try to update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          return await createProfile(updates.full_name || undefined);
        }
        throw error;
      }

      setProfile(data);
      cachedProfile = data;
      lastFetchedAt = Date.now();
      // notify listeners profile was updated and bypass cache on listeners
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
      return data;
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setError(err.message || 'Erro ao atualizar perfil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (): string => {
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  const getInitials = (): string => {
    const name = getDisplayName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setError(null);
    }
  }, [user?.id]);

  // Expose event name for consumers if needed
  const onProfileUpdated = (handler: () => void) => {
    const listener = () => handler();
    window.addEventListener(PROFILE_UPDATED_EVENT, listener);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, listener);
  };

  return {
    profile,
    loading,
    error,
    fetchProfile,
    createProfile,
    updateProfile,
    getDisplayName,
    getInitials,
    onProfileUpdated,
  };
};
