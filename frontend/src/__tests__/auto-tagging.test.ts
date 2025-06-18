import '@testing-library/jest-dom';

// Example generateTags function (copy from your code for test context)
const generateTags = async (title: string, description: string, setTags: (tags: string[]) => void) => {
  try {
    const response = await fetch('/api/generate-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    const data = await response.json();
    if (data.tags) {
      setTags(data.tags);
    }
  } catch (error) {
    // handle error
  }
};

describe('Auto-tagging integration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should call /api/generate-tags and set tags from response', async () => {
    const mockTags = ['cat', 'funny', 'animal'];
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ tags: mockTags }),
    }) as any;

    const setTags = jest.fn();
    await generateTags('Cat video', 'A funny cat video', setTags);

    expect(fetch).toHaveBeenCalledWith('/api/generate-tags', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Cat video', description: 'A funny cat video' }),
    }));
    expect(setTags).toHaveBeenCalledWith(mockTags);
  });

  it('should handle missing tags in response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    }) as any;

    const setTags = jest.fn();
    await generateTags('Dog video', 'A cute dog', setTags);
    expect(setTags).not.toHaveBeenCalled();
  });
}); 