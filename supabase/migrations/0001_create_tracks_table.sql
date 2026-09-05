create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  album text,
  bpm integer,
  musical_key text,
  genre text,
  duration text,
  cover_art_url text default '/images/placeholders/vinyl-default.png',
  thumbnail_url text default '/images/placeholders/vinyl-default.png',
  audio_url text,
  engine_dj_id text unique,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists tracks_artist_idx on tracks (artist);
create index if not exists tracks_engine_dj_id_idx on tracks (engine_dj_id);
