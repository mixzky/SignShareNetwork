import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://njzzkhcoecjmnyuizobo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function updateVideoEmbeddings() {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Get all videos without embeddings
  const { data: videos, error } = await supabase
    .rpc('get_videos_without_embeddings');

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  console.log(`Found ${videos?.length || 0} videos without embeddings`);

  if (!videos || videos.length === 0) {
    console.log('No videos found that need embeddings');
    return;
  }

  // Update each video
  for (const video of videos) {
    try {
      console.log(`Generating embedding for video ${video.id}`);
      
      const { data, error: embedError } = await supabase.functions.invoke('generate-embedding', {
        body: { record: video }
      });

      if (embedError) {
        console.error(`Error generating embedding for video ${video.id}:`, embedError);
        continue;
      }

      console.log(`Successfully generated embedding for video ${video.id}`);
    } catch (err) {
      console.error(`Error processing video ${video.id}:`, err);
    }
  }

  console.log('Finished updating video embeddings');
}

// Run the update
updateVideoEmbeddings().catch(console.error); 