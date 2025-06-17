import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Database } from '@/types/database';

interface GenerateTagsButtonProps {
  videoId: string;
  onSuccess?: (tags: string[]) => void;
}

export function GenerateTagsButton({ videoId, onSuccess }: GenerateTagsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const supabase = createClientComponentClient<Database>();

  const generateTags = async () => {
    try {
      setIsGenerating(true);
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('auto-tag-video', {
        body: { video_id: videoId }
      });

      if (error) {
        throw error;
      }

      // Show success message
      toast.success("Tags generated successfully");

      // Call the success callback if provided
      if (onSuccess && data?.tags) {
        onSuccess(data.tags);
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      toast.error("Failed to generate tags. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generateTags} 
      disabled={isGenerating}
      variant="outline"
      className="ml-2"
    >
      {isGenerating ? 'Generating...' : 'Generate Tags'}
    </Button>
  );
} 