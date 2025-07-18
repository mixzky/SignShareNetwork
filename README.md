<div align="center">

# 🤟 SignShareNetwork

<img  alt="signsharepreview" src="https://github.com/user-attachments/assets/322d40f7-f6fb-456b-a8e9-92855591f776" />

### _Empowering accessible communication through sign language_

**A fullstack sign language video sharing platform that empowers accessible communication through user-contributed sign clips, AI-powered tagging, and community collaboration.**

---

</div>

## 🌟 Features

<table>
<tr>
<td>

### 🔐 Authentication & Profile Management

- 🚀 Google OAuth integration via Supabase Auth
- 👤 Custom user profiles with username, display name, and avatar
- ✏️ Profile editing with avatar upload support
- 🛡️ Role-based access control

</td>
<td>

### 📹 Video Management

- 📤 Upload sign language videos (mp4/webm format)
- 📋 Rich metadata support: title, description, language, region
- 🗄️ Secure video storage using Supabase Storage
- 🗃️ Video metadata management in PostgreSQL

</td>
</tr>
<tr>
<td>

### 🤖 AI-Powered Features

- 🏷️ Automatic tag generation using Google's Vertex AI Gemini Pro
- 🔍 Natural language search intent parsing
- 📊 Embedding video
- 💡 Smart content recommendations
- 🖼️ Picture profile generation using Imagen 4

</td>
<td>

### 🌍 Interactive Globe Interface

- 🌐 3D interactive globe visualization
- 🗺️ Country-based navigation
- ✨ Smooth animations and transitions
- 📱 Responsive design with mobile support

</td>
</tr>
<tr>
<td>

### 📚 Sign Dictionary

- 🔍 Public search/filter functionality for verified sign clips
- 🎯 Multi-criteria search: keywords, language, tags, region
- 🔧 Advanced filtering and sorting options

</td>
<td>

### 👥 Community & Moderation

- ⭐ Rating system
- 💬 Text reviews and comments
- 🛠️ Moderation tools for content management
- 📊 Video status tracking (pending, verified, rejected, flagged)

</td>
</tr>
</table>

## 🛠️ Tech Stack

<div align="center">

|                                                      **Frontend**                                                       |                                                    **Backend**                                                    |                                                      **AI & Cloud**                                                       |
| :---------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------: |
|         ![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)         |    ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)    | ![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white) |
|    ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)    | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) |       ![Vertex AI](https://img.shields.io/badge/Vertex%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)       |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) |     ![Storage](https://img.shields.io/badge/Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)     |                                                                                                                           |
|       ![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)        |        ![Auth](https://img.shields.io/badge/Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)        |                                                                                                                           |

</div>

### 🎨 Frontend

- **⚡ Framework**: Next.js (App Router) with TypeScript
- **🎨 UI Components**:
  - 🌈 Tailwind CSS for styling
  - 🧩 Shadcn/UI components
  - 🔧 Radix UI primitives
- **🌐 3D Visualization**: Three.js with Globe.gl
- **📝 Form Handling**:
  - 📋 React Hook Form
  - ✅ Zod validation

### 🗄️ Backend

- **🚀 Platform**: Supabase
  - 🗃️ PostgreSQL database
  - 🔐 Authentication
  - 📁 Storage
  - ⚡ Edge Functions
- **🤖 AI Integration**: Vertex AI Gemini Pro (Google Cloud)

## 🚀 Getting Started

### 📋 Prerequisites

- 📦 Node.js (v18 or higher)
- 🔧 pnpm (recommended) or npm
- 🔗 Supabase account
- ☁️ Google Cloud account (for AI features)

### ⚙️ Installation

#### 1️⃣ **Clone the repository**

```bash
git clone https://github.com/mixzky/SignShareNetwork.git
cd SignShareNetwork
```

#### 2️⃣ **Install dependencies**

```bash
npm install
```

#### 3️⃣ **Set up environment variables**

To connect the application to your Supabase project, create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

> **⚠️ Important Notes:**
>
> - 🔍 You can find your Supabase Project URL and `anon` key under **Settings > API** in your Supabase project.
> - 🌐 The `NEXT_PUBLIC_` prefix exposes variables to the browser (as required by Next.js).
> - 🔒 **Do NOT commit your `.env.local` file to version control** — it contains sensitive data. This file is typically included in `.gitignore` by default in most Next.js projects.

#### 4️⃣ **Start the development server**

```bash
npm run dev
```

🎉 Visit [http://localhost:3000](http://localhost:3000) to see the application!

## 📁 Project Structure

```
📦 signshare/
├── 🎨 frontend/
│   ├── 📂 src/
│   │   ├── 📄 app/           # Next.js pages and routes
│   │   ├── 🧩 components/    # React components
│   │   ├── 📚 lib/           # Utility functions
│   │   ├── 📝 types/         # TypeScript definitions
│   │   └── 🔧 utils/         # Shared utilities
│   ├── 🖼️ public/            # Static assets
│   └── 🧪 tests/             # E2E and integration tests
└── 🗄️ supabase/
    └── ⚡ functions/         # Supabase Edge Functions (optional)
```

## 🧪 Testing

The project includes comprehensive testing:

### 🔬 Run unit tests

```bash
npm run tests
```

## 🔐 Security

- 🔑 All authentication is handled through Supabase Auth
- 🛡️ Secure storage of sensitive information using environment variables
- 👮 Role-based access control for admin features
- ✅ Input validation and sanitization
- 📁 Secure file upload handling

---

## 🙏 Acknowledgments

<div align="center">

**Built with love using these amazing technologies:**

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://globe.gl/)
[![Shadcn/UI](https://img.shields.io/badge/Shadcn/UI-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)

</div>

<div align="center">

---

**🤟 Making sign language more accessible, one video at a time 🤟**

_If you find this project helpful, please consider giving it a ⭐_

</div>
