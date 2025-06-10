import { faker } from '@faker-js/faker';
import { createClient } from '../supabase/client';
import { User } from '@supabase/supabase-js';

describe('Authentication Tests (Real Supabase)', () => {
  // Use a real email that's already confirmed in your Supabase project
  const testEmail = faker.internet.email().toLocaleLowerCase(); // Replace with your confirmed test email
  const testPassword = faker.internet.password();
  const supabase = createClient();

  let session: any;
  let testUser: User | null = null;

  beforeAll(async () => {
    // Clean up any existing test user
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.log('No existing user to clean up');
    }

    // Try to sign in first (in case user already exists)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      // If sign in fails, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (signUpError) {
        throw new Error(`Sign-up failed: ${signUpError.message}`);
      }

      testUser = signUpData.user;
      
      // Wait a bit for the signup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try signing in again after signup
      const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (retrySignInError) {
        throw new Error(`Sign-in after signup failed: ${retrySignInError.message}`);
      }

      session = retrySignInData.session;
    } else {
      session = signInData.session;
      testUser = signInData.user;
    }
  });

  afterAll(async () => {
    // Clean up: Sign out
    if (session) {
      await supabase.auth.signOut();
    }
  });

  test('should have valid session', () => {
    expect(session).not.toBeNull();
    expect(testUser).not.toBeNull();
    expect(testUser?.email).toBe(testEmail);
  });

  test('should sign in an existing user', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    expect(data.user?.email).toBe(testEmail);
    expect(data.session).not.toBeNull();
  });

  test('should get current user', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();

    expect(error).toBeNull();
    expect(user).not.toBeNull();
    expect(user?.email).toBe(testEmail);
  });

  test('should sign out user', async () => {
    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();

    // Verify user is signed out
    const { data: { user } } = await supabase.auth.getUser();
    expect(user).toBeNull();
  });

  test('should handle invalid login credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: faker.internet.email(),
      password: 'wrongpassword',
    });

    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
    expect(error?.message.toLowerCase()).toContain('invalid');
  });
});
