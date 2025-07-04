# SignShare Backend Documentation

## Table of Contents
- [1. Database Architecture](#1-database-architecture)
- [2. Security Features](#2-security-features)
- [3. Search & Performance](#3-search--performance)
- [4. Extensions](#4-extensions)
- [5. Analytics & Monitoring](#5-analytics--monitoring)
- [6. Content Management](#6-content-management)
- [7. API Endpoints](#7-api-endpoints)
- [8. Rate Limiting](#8-rate-limiting)
- [9. Environment Variables](#9-environment-variables)
- [10. Backup & Recovery](#10-backup--recovery)
- [11. Monitoring & Alerts](#11-monitoring--alerts)

## 1. Database Architecture

### Core Tables

#### Users (`public.users`)
- Primary user information storage
- Fields:
  ```sql
  id            UUID (from auth.uid())
  username      TEXT UNIQUE
  display_name  TEXT
  email         VARCHAR
  avatar_url    VARCHAR
  role          VARCHAR (default: 'user')
  bio           TEXT
  is_disabled   BOOLEAN
  banned        BOOLEAN
  created_at    TIMESTAMPTZ
  updated_at    DATE
  ```

#### Sign Videos (`public.sign_videos`)
- Stores sign language video content
- Fields:
  ```sql
  id          UUID
  video_url   TEXT
  title       TEXT
  description TEXT
  language    TEXT (default: 'Thai')
  region      TEXT
  tags        TEXT[]
  status      TEXT
  user_id     UUID
  search_doc  TSVECTOR
  embedding   VECTOR
  isflag      BOOLEAN
  created_at  TIMESTAMPTZ
  ```

### Supporting Tables

#### Reviews (`public.reviews`)
- User feedback on videos
- Fields:
  ```sql
  id         UUID
  video_id   UUID
  user_id    UUID
  rating     INTEGER
  comment    TEXT
  created_at TIMESTAMPTZ
  ```

#### Flags (`public.flags`)
- Content moderation system
- Fields:
  ```sql
  id          UUID
  video_id    UUID
  flagged_by  UUID
  reason      TEXT
  status      VARCHAR (default: 'pending')
  resolved_by UUID
  resolved_at TIMESTAMP
  created_at  TIMESTAMPTZ
  ```

#### Activities (`public.activities`)
- User activity feed events
- Fields:
  ```sql
  id        UUID
  type      TEXT
  user_id   UUID
  video_id  UUID
  message   TEXT
  created_at TIMESTAMPTZ
  ```

## 2. Security Features

### Row Level Security (RLS)
All critical tables have RLS enabled:
- `users`
- `sign_videos`
- `reviews`
- `flags`
- `activities`

### Authentication
- Supabase Auth integration
- Supported methods:
  - Email/password
  - Social login providers
- Session management
- Password reset functionality

## 3. Search & Performance

### Video Search Implementation
1. Full-text Search
   - Uses PostgreSQL `tsvector` for text search
   - Indexes on title and description
   - Language support for Thai and English

2. Vector Similarity Search
   - Uses `pgvector` extension
   - Embedding generation for semantic search
   - Nearest neighbor search capabilities

### Performance Optimizations
- Indexed foreign keys
- Caching strategy:
  ```sql
  -- Example cache control
  Cache-Control: public, max-age=3600
  ```
- Rate limiting implementation
- Query optimization

## 4. Extensions

Essential Supabase Extensions:
```sql
vector        -- Semantic search functionality
pg_graphql    -- GraphQL API support
pg_cron       -- Scheduled tasks
http          -- External API integrations
pg_net        -- Async HTTP operations
```

## 5. Analytics & Monitoring

### Tables

#### Video Upload Stats
```sql
CREATE TABLE video_upload_stats (
  id           UUID,
  upload_count BIGINT,
  recorded_at  TIMESTAMP,
  country      TEXT
);
```

#### Video Access Logs
```sql
CREATE TABLE video_access_logs (
  id         UUID,
  video_id   UUID,
  accessed_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address TEXT
);
```

#### Search Logs
```sql
CREATE TABLE search_logs (
  id               UUID,
  user_id          UUID,
  query_text       TEXT,
  matched_video_id UUID,
  created_at       TIMESTAMPTZ
);
```

## 6. Content Management

### Video Requirements
- Format: MP4, WebM
- Maximum size: 50MB
- Resolution: HD (1080p) preferred
- Duration: No strict limit

### Storage Configuration
- Regional buckets
- Cache control headers
- Access logging
- Content delivery optimization

## 7. API Endpoints

### Authentication
```typescript
POST /auth/signup
POST /auth/login
POST /auth/logout
POST /auth/reset-password
```

### Videos
```typescript
GET    /videos
POST   /videos/upload
GET    /videos/:id
PUT    /videos/:id
DELETE /videos/:id
```

### User Management
```typescript
GET /users/:id
PUT /users/:id
GET /users/:id/videos
GET /users/:id/activities
```

### Moderation
```typescript
POST /flags
GET  /flags
PUT  /flags/:id/resolve
```

## 8. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Video access | 10 requests/minute/IP |
| API endpoints | Standard Supabase limits |
| Upload | 50MB per file |

## 9. Environment Variables

Required configuration:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 10. Backup & Recovery

### Automated Backups
- Frequency: Daily
- Retention: 7 days (Free tier)
- Type: Full database backup

### Recovery Options
- Point-in-time recovery
- Full database restore
- Table-level recovery

## 11. Monitoring & Alerts

### Performance Monitoring
- `pg_stat_statements` for query analysis
- Connection pooling metrics
- Cache hit ratios

### Error Tracking
```sql
CREATE TABLE debug_logs (
  id         SERIAL,
  event      TEXT,
  data       JSONB,
  created_at TIMESTAMPTZ
);
```

### Activity Monitoring
- User actions tracking
- System events logging
- Performance metrics collection

---

