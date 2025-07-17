# SignShareNetwork
<img width="1775" height="937" alt="signsharepreview" src="https://github.com/user-attachments/assets/322d40f7-f6fb-456b-a8e9-92855591f776" />

A fullstack sign language video sharing platform that empowers accessible communication through user-contributed sign clips, AI-powered tagging, and community collaboration.

## 🌟 Features

### Authentication & Profile Management
- Google OAuth integration via Supabase Auth
- Custom user profiles with username, display name, and avatar
- Profile editing with avatar upload support
- Role-based access control

### Video Management
- Upload sign language videos (mp4/webm format)
- Rich metadata support: title, description, language, region
- Secure video storage using Supabase Storage
- Video metadata management in PostgreSQL

### AI-Powered Features
- Automatic tag generation using Google's Vertex AI Gemini Pro
- Natural language search intent parsing
- Embedding video 
- Smart content recommendations

### Interactive Globe Interface
- 3D interactive globe visualization
- Country-based navigation
- Smooth animations and transitions
- Responsive design with mobile support

### Sign Dictionary
- Public search/filter functionality for verified sign clips
- Multi-criteria search: keywords, language, tags, region
- Advanced filtering and sorting options

### Community & Moderation
- rating system
- Text reviews and comments
- Moderation tools for content management
- Video status tracking (pending, verified, rejected, flagged)

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (App Router) with TypeScript
- **UI Components**: 
  - Tailwind CSS for styling
  - Shadcn/UI components
  - Radix UI primitives
- **3D Visualization**: Three.js with Globe.gl
- **Form Handling**: 
  - React Hook Form
  - Zod validation

### Backend
- **Platform**: Supabase
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions
- **AI Integration**: Vertex AI Gemini Pro (Google Cloud)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm (recommended) or npm
- Supabase account
- Google Cloud account (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mixzky/SignShareNetwork.git
   cd SignShareNetwork
   ```

2. Install dependencies
   ```bash
   npm install

3. Set up environment variables
To connect the application to your Supabase project, create a `.env.local` file in the root directory and add the following:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```
**Important Notes:**

- You can find your Supabase Project URL and `anon` key under **Settings > API** in your Supabase project.
- The `NEXT_PUBLIC_` prefix exposes variables to the browser (as required by Next.js).
- **Do NOT commit your `.env.local` file to version control** — it contains sensitive data. This file is typically included in `.gitignore` by default in most Next.js projects.
  
4. Start the development server
 ```bash
   npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```text
signshare/
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages and routes
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility functions
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Shared utilities
│   ├── public/            # Static assets
│   └── tests/             # E2E and integration tests
└── supabase/
    └── functions/         # Supabase Edge Functions (optional)
```

## 🧪 Testing

The project includes comprehensive testing:

### Run unit tests
```bash
npm run tests
```

## 🔐 Security

- All authentication is handled through Supabase Auth
- Secure storage of sensitive information using environment variables
- Role-based access control for admin features
- Input validation and sanitization
- Secure file upload handling

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Globe.gl](https://globe.gl/) for 3D globe visualization
- [Shadcn/UI](https://ui.shadcn.com/) for UI components
- [Google Cloud](https://cloud.google.com/) for AI capabilities 
