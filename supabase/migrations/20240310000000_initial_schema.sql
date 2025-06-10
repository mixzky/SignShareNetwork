-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  display_name text not null,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create sign_videos table
create table public.sign_videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  video_url text not null,
  title text not null,
  description text not null,
  language text not null,
  region text not null,
  tags text[] default '{}',
  status text not null default 'pending' check (status in ('pending', 'verified', 'flagged')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reviews table
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references public.sign_videos on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  comment text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create flags table
create table public.flags (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references public.sign_videos on delete cascade not null,
  flagged_by uuid references public.users on delete cascade not null,
  reason text not null,
  resolved_by uuid references public.users on delete cascade,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.users enable row level security;
alter table public.sign_videos enable row level security;
alter table public.reviews enable row level security;
alter table public.flags enable row level security;

-- Users policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Sign videos policies
create policy "Anyone can view verified videos"
  on public.sign_videos for select
  using (status = 'verified');

create policy "Users can view their own videos"
  on public.sign_videos for select
  using (auth.uid() = user_id);

create policy "Users can create videos"
  on public.sign_videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own videos"
  on public.sign_videos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own videos"
  on public.sign_videos for delete
  using (auth.uid() = user_id);

-- Reviews policies
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Flags policies
create policy "Moderators and admins can view flags"
  on public.flags for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('moderator', 'admin')
    )
  );

create policy "Authenticated users can create flags"
  on public.flags for insert
  with check (auth.uid() = flagged_by);

-- Create functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create storage buckets
insert into storage.buckets (id, name, public) values ('videos', 'videos', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage policies
create policy "Anyone can view videos"
  on storage.objects for select
  using (bucket_id = 'videos');

create policy "Authenticated users can upload videos"
  on storage.objects for insert
  with check (
    bucket_id = 'videos'
    and auth.role() = 'authenticated'
  );

create policy "Users can update their own videos"
  on storage.objects for update
  using (
    bucket_id = 'videos'
    and auth.uid() = owner
  );

create policy "Users can delete their own videos"
  on storage.objects for delete
  using (
    bucket_id = 'videos'
    and auth.uid() = owner
  );

-- Avatar storage policies
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() = owner
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() = owner
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() = owner
  ); 