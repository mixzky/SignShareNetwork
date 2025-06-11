import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

// Create a single instance of the Supabase client
const supabase = createClientComponentClient<Database>();

export default supabase; 