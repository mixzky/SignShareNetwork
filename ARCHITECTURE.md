# SignShareNetwork Technical Architecture

## 🏗️ System Overview

SignShareNetwork is built as a modern web application with a microservices-inspired architecture, leveraging Supabase for backend services and Next.js for the frontend.

## 🎯 Architecture Goals

1. **Scalability**
   - Horizontally scalable components
   - Efficient resource utilization
   - Optimized data storage and retrieval

2. **Performance**
   - Fast page loads and interactions
   - Optimized video delivery
   - Efficient search capabilities

3. **Security**
   - Robust authentication
   - Secure data storage
   - Protected API endpoints

4. **Maintainability**
   - Modular code structure
   - Clear separation of concerns
   - Comprehensive testing

## 🔧 Technical Stack

### Frontend Architecture

1. **Next.js App Router**
   - Server-side rendering
   - Client-side navigation
   - Optimized asset loading
   - Route groups and layouts

2. **State Management**
   - React hooks for local state
   - Server components for data fetching
   - Client components for interactivity

3. **UI Components**
   - Shadcn/UI for base components
   - Tailwind CSS for styling
   - Radix UI for accessibility
   - Custom components for specific features

4. **3D Visualization**
   - Three.js for 3D rendering
   - Globe.gl for globe visualization
   - Custom WebGL shaders
   - Optimized performance

### Backend Architecture (Supabase)

1. **Database Schema**
   ```sql
   -- Users table - Core user data and profile information
   users (
     id uuid primary key default auth.uid(),
     created_at timestamptz not null default now(),
     role varchar not null default 'user',
     avatar_url varchar,
     is_disabled boolean not null default false,
     display_name text,
     username text not null unique,
     bio text,
     updated_at date,
     email varchar default '',
     banned boolean default false
   )

   -- Sign videos table - Main video content storage
   sign_videos (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     video_url text,
     title text,
     description text,
     language text default 'Thai',
     region text not null,
     tags text[],
     status text,
     reviewed_by uuid,
     user_id uuid references users,
     search_doc tsvector generated always as (
       setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
       setweight(to_tsvector('english', coalesce(description, '')), 'B')
     ) stored,
     embedding vector,
     isflag boolean not null default false
   )

   -- Reviews table - User feedback and ratings
   reviews (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     video_id uuid references sign_videos,
     user_id uuid references users,
     rating integer,
     comment text
   )

   -- Flags table - Content moderation system
   flags (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     video_id uuid references sign_videos,
     flagged_by uuid references users,
     reason text,
     resolved_by uuid,
     resolved_at timestamp,
     status varchar default 'pending'
   )

   -- Search logs - Track user search patterns
   search_logs (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     user_id uuid references users,
     query_text text,
     extracted_keyword text,
     matched_video_id uuid references sign_videos
   )

   -- AI suggestions - Store AI-generated content
   suggestions (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     video_id uuid references sign_videos,
     type text,
     content jsonb,
     created_by uuid references users
   )

   -- Video upload statistics
   video_upload_stats (
     id uuid primary key default gen_random_uuid(),
     upload_count bigint default 0,
     recorded_at timestamp default now(),
     country text
   )

   -- User activities feed
   activities (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     type text,
     user_id uuid references users,
     video_id uuid,
     message text
   )
   ```

2. **Database Features**
   - Full-text search using tsvector
   - Vector embeddings for semantic search
   - Row Level Security (RLS) policies
   - Foreign key relationships
   - Automated timestamps
   - UUID primary keys
   - JSON storage for flexible data

3. **Storage Structure**
   ```
   storage/
   ├── videos/           # Video files
   │   ├── original/     # Original uploads
   │   └── processed/    # Processed versions
   ├── avatars/         # User profile pictures
   └── assets/          # Static assets
   ```

4. **Edge Functions**
   - Video processing and optimization
   - AI tag generation using Vertex AI
   - Search optimization with embeddings
   - Activity feed management
   - Content moderation

### Search Architecture

1. **Multi-Modal Search**
   ```mermaid
   graph TD
     A[User Query] --> B{Query Type}
     B -->|Text| C[Full-text Search]
     B -->|Semantic| D[Vector Search]
     B -->|Tag| E[Tag-based Search]
     C --> F[Combine Results]
     D --> F
     E --> F
     F --> G[Rank & Filter]
     G --> H[Return Results]
   ```

2. **Search Features**
   - Full-text search with PostgreSQL tsvector
   - Semantic search using vector embeddings
   - Tag-based filtering
   - Language/region filtering
   - Relevance ranking
   - Search analytics

### Video Processing Pipeline

1. **Upload Flow**
   ```mermaid
   graph TD
     A[User Upload] --> B[Store Original]
     B --> C[Process Video]
     C --> D[Generate Thumbnail]
     C --> E[Optimize Format]
     C --> F[Extract Metadata]
     F --> G[AI Analysis]
     G --> H[Generate Tags]
     G --> I[Content Moderation]
     H --> J[Update Database]
     I --> J
   ```

2. **Processing Features**
   - Video format optimization
   - Thumbnail generation
   - Automatic tagging
   - Content moderation
   - Metadata extraction

### Security Implementation

1. **Authentication**
   - JWT-based authentication
   - Role-based access control (user, moderator, admin)
   - Session management
   - OAuth integration (Google)

2. **Row Level Security Policies**
   ```sql
   -- Example RLS policies
   -- Videos access policy
   create policy "Public videos are viewable by everyone"
     on sign_videos for select
     using (status = 'verified');

   -- User data protection
   create policy "Users can only edit their own profile"
     on users for update
     using (auth.uid() = id);
   ```

3. **API Security**
   - Request validation
   - Rate limiting
   - CORS configuration
   - Input sanitization

### Performance Optimizations

1. **Database Indexes**
   ```sql
   -- Full-text search index
   create index sign_videos_search_idx 
     on sign_videos using gin(search_doc);

   -- Vector similarity search index
   create index sign_videos_embedding_idx 
     on sign_videos using ivfflat (embedding vector_cosine_ops)
     with (lists = 100);
   ```

2. **Caching Strategy**
   - Client-side caching
   - CDN for static assets
   - Database query caching
   - Edge function caching

3. **Load Management**
   - Connection pooling
   - Query optimization
   - Batch processing
   - Async operations

## 🔄 Data Flow

1. **Video Upload Flow**
   ```mermaid
   sequenceDiagram
     participant User
     participant Frontend
     participant Supabase
     participant AI

     User->>Frontend: Upload Video
     Frontend->>Supabase: Store Video
     Supabase->>AI: Process Video
     AI->>Supabase: Return Tags
     Supabase->>Frontend: Update UI
     Frontend->>User: Show Success
   ```

2. **Search Flow**
   ```mermaid
   sequenceDiagram
     participant User
     participant Frontend
     participant Supabase
     participant Search

     User->>Frontend: Enter Query
     Frontend->>Search: Process Query
     Search->>Supabase: Execute Search
     Supabase->>Frontend: Return Results
     Frontend->>User: Display Results
   ```

## 🔒 Security Architecture

1. **Authentication**
   - JWT-based auth
   - Role-based access control
   - Secure session management

2. **Data Protection**
   - Row Level Security (RLS)
   - Encrypted storage
   - Input validation
   - XSS prevention

3. **API Security**
   - Rate limiting
   - CORS configuration
   - Request validation
   - Error handling

## 📈 Scalability Considerations

1. **Database Optimization**
   - Indexed queries
   - Materialized views
   - Connection pooling
   - Query caching

2. **Content Delivery**
   - CDN integration
   - Video streaming
   - Asset optimization
   - Lazy loading

3. **Performance Monitoring**
   - Real-time metrics
   - Error tracking
   - Performance analytics
   - User monitoring

## 🧪 Testing Architecture

1. **Test Types**
   - Integration tests
   - E2E tests (Playwright)

2. **Test Coverage**
   - API testing
   - Database testing
   - UI testing

## 📊 Monitoring and Logging

1. **System Monitoring**
   - Performance metrics
   - Error tracking
   - User analytics
   - Resource usage

2. **Logging Strategy**
   - Structured logging
   - Log aggregation
   - Alert system
   - Audit trails

## 🔄 Future Considerations

1. **Scalability**
   - Microservices migration
   - Database sharding
   - Load balancing
   - Cache optimization

2. **Features**
   - Real-time collaboration
   - Advanced AI features
   - Mobile applications
   - API marketplace

3. **Integration**
   - Third-party services
   - Payment processing
   - Social features
   - Analytics integration 
