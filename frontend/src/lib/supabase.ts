"use client";

// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { Database } from '@/types/database'; 
export const supabaseBrowserClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type UserProfile = {
  id: string; 
  username: string;
  display_name: string;
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
  updated_at: string;
  avatar_url: string | null; 
  bio: string | null;          
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkInitialUserSession = async () => {
      console.log('Checking initial user session...');
      const { data: { user: initialUser }, error } = await supabaseBrowserClient.auth.getUser();

      if (error) {
        console.error('Error getting initial user session:', error);
      }
      setUser(initialUser);
      setLoading(false);
      setInitialized(true);
      console.log('Initial user session checked. User:', initialUser ? initialUser.id : 'null');
    };

    checkInitialUserSession();

    const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed. Event:', _event, 'Session user:', session?.user?.id || 'null');
        setUser(session?.user || null);
        setLoading(false);
        setInitialized(true);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, initialized };
};


export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log(`Fetching profile for userId: ${userId} from 'users' table`);
  const { data, error } = await supabaseBrowserClient
    .from('users') // Changed from 'profiles' to 'users'
    .select('id, username, display_name, role, created_at, updated_at, avatar_url, bio') 
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
  if (!data) {
    console.log(`No profile found for userId: ${userId}. Returning null.`);
    return null;
  }
  return data;
}

type ProfileUpdates = {
  display_name?: string;
  bio?: string | null;
  avatar_url?: string | null;
};

export async function createUserProfile(userId: string, username: string, initialData?: { display_name?: string; bio?: string | null }): Promise<UserProfile> {
  console.log(`Creating profile for userId: ${userId} with username: ${username} and initial data:`, initialData);
  const { data, error } = await supabaseBrowserClient
    .from('users')
    .insert({
      id: userId,
      username: username,
      display_name: initialData?.display_name || username,
      bio: initialData?.bio || null,
      role: 'user', // Default role
    })
    .select('id, username, display_name, role, created_at, updated_at, avatar_url, bio')
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
  if (!data) {
    throw new Error('Failed to retrieve newly created profile data.');
  }
  return data;
}

export async function updateUserProfile(userId: string, updates: ProfileUpdates): Promise<UserProfile> {
  console.log(`Updating profile for userId: ${userId} in 'users' table with updates:`, updates);
  const { data, error } = await supabaseBrowserClient
    .from('users') // Changed from 'profiles' to 'users'
    .update(updates)
    .eq('id', userId)
    .select('id, username, display_name, role, created_at, updated_at, avatar_url, bio') 
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
  if (!data) {
    throw new Error('Failed to retrieve updated profile data.');
  }
  return data;
}


export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  console.log(`Uploading avatar to: ${filePath}`);
  const { data, error } = await supabaseBrowserClient.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseBrowserClient.storage
    .from('avatars')
    .getPublicUrl(filePath);

  if (publicUrlData.publicUrl) {
    return publicUrlData.publicUrl;
  } else {
    throw new Error('Failed to get public URL for uploaded avatar.');
  }
}

export async function deleteAvatar(userId: string, avatarUrl: string): Promise<void> {
  const urlParts = avatarUrl.split('public/avatars/');
  if (urlParts.length < 2) {
    console.warn('Could not parse avatar URL for deletion:', avatarUrl);
    return;
  }
  const filePathToDelete = urlParts[1];

  console.log(`Attempting to delete avatar at storage path: ${filePathToDelete}`);

  const { error } = await supabaseBrowserClient.storage
    .from('avatars')
    .remove([filePathToDelete]);

  if (error) {
    console.error('Error deleting old avatar:', error);
    throw new Error(`Failed to delete old avatar from storage: ${error.message}`);
  }
}