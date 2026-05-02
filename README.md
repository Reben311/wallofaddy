# Wall of Addy — Setup Guide

## Quick Start (Local Dev)

```bash
npm install
npm start
```

---

## Database Integration (Supabase — Recommended, Free Tier)

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project** → fill in name, password, region
3. Wait ~2 minutes for it to spin up

---

### Step 2 — Create the `posts` Table

In Supabase → **SQL Editor**, run:

```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  btc_address text not null,
  nickname text,
  message text,
  reactions jsonb default '{"🔥":0,"⚡":0,"💜":0}'::jsonb,
  created_at timestamptz default now()
);

-- Allow public reads & inserts (no auth required)
alter table posts enable row level security;

create policy "Anyone can read posts"
  on posts for select using (true);

create policy "Anyone can insert posts"
  on posts for insert with check (true);

create policy "Anyone can update reactions"
  on posts for update using (true);
```

---

### Step 3 — Install Supabase Client

```bash
npm install @supabase/supabase-js
```

---

### Step 4 — Add Environment Variables

Create a `.env` file in the project root:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

Get both values from Supabase → **Project Settings** → **API**.

---

### Step 5 — Create `src/lib/supabase.js`

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
```

---

### Step 6 — Replace Mock Data in `App.js`

Replace the seed data loading in `useEffect` with:

```js
import { supabase } from './lib/supabase';

// In useEffect (init):
useEffect(() => {
  async function loadPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) {
      setPosts(data);
      const shuffled = shuffle(data);
      setWallPosts(shuffled.slice(0, MAX_POSTS));
      setCurrentRandom(shuffled[0] || null);
    }
  }
  loadPosts();
}, []);
```

---

### Step 7 — Update `handleSubmit` to Save to DB

```js
const handleSubmit = async ({ btc_address, nickname, message }) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ btc_address, nickname, message }])
    .select()
    .single();

  if (!error && data) {
    setPosts(prev => [data, ...prev]);
    setWallPosts(prev => [data, ...shuffle(prev).slice(0, MAX_POSTS - 1)]);
    setNewPostIds(prev => new Set([...prev, data.id]));
    setTimeout(() => setNewPostIds(prev => {
      const s = new Set(prev); s.delete(data.id); return s;
    }), 3000);
  }
};
```

---

### Step 8 — Update `handleReact` to Persist Reactions

```js
const handleReact = async (id, emoji) => {
  // Optimistic UI update
  setPosts(prev => prev.map(p =>
    p.id === id ? { ...p, reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] || 0) + 1 } } : p
  ));
  setWallPosts(prev => prev.map(p =>
    p.id === id ? { ...p, reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] || 0) + 1 } } : p
  ));

  // Persist to DB
  const { data: post } = await supabase.from('posts').select('reactions').eq('id', id).single();
  if (post) {
    const updated = { ...post.reactions, [emoji]: (post.reactions[emoji] || 0) + 1 };
    await supabase.from('posts').update({ reactions: updated }).eq('id', id);
  }
};
```

---

### Step 9 — Enable Real-Time (Optional but Awesome)

Add this to your init `useEffect` to get live updates:

```js
const channel = supabase
  .channel('posts-live')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
    setPosts(prev => [payload.new, ...prev]);
    setWallPosts(prev => [payload.new, ...prev.slice(0, MAX_POSTS - 1)]);
    setNewPostIds(prev => new Set([...prev, payload.new.id]));
  })
  .subscribe();

return () => supabase.removeChannel(channel);
```

---

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
# Follow prompts — add env vars when asked
```

### Netlify

```bash
npm run build
# Drag & drop the `build/` folder to netlify.com/drop
# Add env vars in Site Settings → Environment Variables
```

---

## Alternative Database Options

| Database       | Notes                                      |
|----------------|--------------------------------------------|
| **Supabase**   | Recommended. Free, real-time, Postgres     |
| **PlanetScale**| MySQL, serverless, generous free tier      |
| **MongoDB Atlas** | NoSQL, free 512MB, easy JSON storage   |
| **Firebase**   | Google, real-time, easy but vendor lock-in |
| **Neon**       | Serverless Postgres, great DX              |

---

## Rate Limiting (Optional)

To prevent spam, add to Supabase → SQL Editor:

```sql
-- Limit: 1 post per BTC address per hour
create or replace function check_rate_limit()
returns trigger as $$
begin
  if (
    select count(*) from posts
    where btc_address = NEW.btc_address
    and created_at > now() - interval '1 hour'
  ) >= 1 then
    raise exception 'Rate limit: 1 post per address per hour';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger enforce_rate_limit
  before insert on posts
  for each row execute procedure check_rate_limit();
```
