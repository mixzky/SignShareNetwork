A fullstack sign language video sharing platform — empowering accessible communication through user-contributed sign clips, AI-powered tagging, and community collaboration.

  Tech Stack
	•	AI: Vertex AI Gemini Pro (Google Cloud)
	•	Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
	•	Frontend: Next.js (App Router) + TypeScript
	•	UI: Tailwind CSS + Shadcn/UI + Radix
    •   Validation: Zod + React Hook Form
	•	Deployment: ??? (Frontend), Supabase (Backend)

Features

 Authentication & Profile
	•	Google login via Supabase Auth
	•	Custom users table: username, display_name, avatar, role
	•	Edit profile with avatar upload to Supabase Storage

 Sign Video Upload
	•	Upload sign-language videos (mp4/webm)
	•	Input: title, description, language, region
	•	Videos stored in Supabase Storage
	•	Metadata saved to sign_videos table

 AI-Powered Features (via Vertex AI)
	•	Automatic tag generation using Gemini
	•	Search intent parser (natural-language → keyword)
	•	Review summarization from community comments

 Sign Dictionary
	•	Public search/filter of verified sign clips
	•	Search by keyword, language, tag, or region

 Reviews & Moderation
	•	Submit 1–5 star ratings and text reviews
	•	Moderators can flag, verify, or remove videos
	•	Status field: pending, verified, flagged

⸻

Local Development

1. Clone & Install
git clone https://github.com/your-username/signshare-network.git
cd signshare-network
pnpm install
2. Setup Environment Variables

Create a .env.local file:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=sign-videos

GCP_PROJECT_ID=your-google-project-id
VERTEX_REGION=us-central1
VERTEX_MODEL=gemini-1.5-pro
VERTEX_API_KEY=your-api-key

3. Run Dev Server
npm run dev

Supabase Tables (Quick Overview)
	•	users: id, username, display_name, avatar_url, role
	•	sign_videos: id, user_id, video_url, title, tags[], status
	•	reviews: id, video_id, user_id, rating, comment
	•	flags: id, video_id, reason, resolved_by

You can use the provided schema.sql to set up tables quickly.

⸻

Security Notes
	•	Use RLS (Row-Level Security) to protect access to sign_videos and users
	•	Keep your Vertex API key server-side only (via Edge Function or API route)
	•	Protect uploads and moderation routes with user roles

⸻

AI Prompt Examples
	•	Auto-tagging:
Suggest 3 relevant tags for this sign video titled “thank you (formal)”
	•	Review summary:
Summarize the following 5 reviews into 1 sentence.
	•	Search intent:
Extract keyword and language from:
“What’s the sign for love in Thai Sign Language?”
