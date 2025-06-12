import { getSupabaseClient } from '@/lib/supabase';
import { getCurrentUser, updateUserProfile, uploadVideo } from '@/lib/supabase';

// Mock the createClient function
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-user-id', display_name: 'Test User' },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'test-user-id', display_name: 'Updated Name' },
              error: null
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-video-id' },
            error: null
          }))
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => ({
          data: { path: 'test-path' },
          error: null
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://test-url.com/video.mp4' }
        }))
      }))
    },
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    }
  }))
}));

describe('Supabase Backend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Profile Management', () => {
    test('should get current user successfully', async () => {
      const user = await getCurrentUser();
      expect(user).toBeDefined();
      expect(user.id).toBe('test-user-id');
    });

    test('should update user profile successfully', async () => {
      const updates = {
        display_name: 'Updated Name',
        bio: 'New bio'
      };

      const updatedProfile = await updateUserProfile('test-user-id', updates);
      expect(updatedProfile).toBeDefined();
      expect(updatedProfile.display_name).toBe('Updated Name');
    });

    test('should handle profile update errors', async () => {
      const mockError = new Error('Update failed');
      const supabase = getSupabaseClient();
      jest.spyOn(supabase, 'from').mockImplementationOnce(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: mockError
              }))
            }))
          }))
        }))
      }));

      await expect(updateUserProfile('test-user-id', { display_name: 'Test' }))
        .rejects
        .toThrow(mockError);
    });
  });

  describe('Video Upload', () => {
    test('should upload video successfully', async () => {
      const mockFile = new File(['test video content'], 'test.mp4', { type: 'video/mp4' });
      const result = await uploadVideo('test-user-id', mockFile);

      expect(result).toBeDefined();
      expect(result.publicUrl).toBe('https://test-url.com/video.mp4');
      expect(result.storagePath).toContain('video/');
    });

    test('should validate video file type', async () => {
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      await expect(uploadVideo('test-user-id', invalidFile))
        .rejects
        .toThrow('Please upload a video file');
    });

    test('should handle upload errors', async () => {
      const mockError = new Error('Upload failed');
      const supabase = getSupabaseClient();
      jest.spyOn(supabase.storage, 'from').mockImplementationOnce(() => ({
        upload: jest.fn(() => ({
          data: null,
          error: mockError
        })),
        getPublicUrl: jest.fn()
      }));

      const mockFile = new File(['test video content'], 'test.mp4', { type: 'video/mp4' });
      await expect(uploadVideo('test-user-id', mockFile))
        .rejects
        .toThrow(mockError);
    });
  });
}); 