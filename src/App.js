import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AddyCard from './components/AddyCard';
import RandomCard from './components/RandomCard';
import PostModal from './components/PostModal';
import { supabase } from './lib/supabase';

const REFRESH_MS = 10 * 60 * 1000;
const MAX_POSTS = 18;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function HeroDecor() {
  return (
    <motion.div
      className="hero-decor"
      initial={{ opacity: 0, scale: 0.94, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.16, type: 'spring', stiffness: 180, damping: 22 }}
      aria-hidden="true"
    >
      <div className="decor-glow" />

      <motion.div
        className="orbit-ring orbit-ring-one"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
      />

      <motion.div
        className="orbit-ring orbit-ring-two"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
      />

      <div className="qr-tile">
        {Array.from({ length: 36 }, (_, i) => (
          <span key={i} className={(i % 3 === 0 || i % 7 === 0 || i === 22) ? 'is-lit' : ''} />
        ))}
      </div>

      <motion.div
        className="floating-chip chip-one"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
      >
        <strong>18</strong>
        <span>random addys</span>
      </motion.div>

      <motion.div
        className="floating-chip chip-two"
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
      >
        <strong>10m</strong>
        <span>wall refresh</span>
      </motion.div>

      <motion.div
        className="floating-chip chip-three"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4.1, ease: 'easeInOut' }}
      >
        <strong>open</strong>
        <span>tip board</span>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const fetchPosts = useCallback(async () => {
  setLoading(true);

  const { data, error } = await supabase
    .from('addy_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error.message);
    setLoading(false);
    return;
  }

  const realPosts = data || [];

  setPosts(realPosts);
  setWallPosts(shuffle(realPosts).slice(0, MAX_POSTS));
  setCurrentRandom(shuffle(realPosts)[0] || null);
  setLoading(false);
}, []);
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);
  const [wallPosts, setWallPosts] = useState([]);
  const [currentRandom, setCurrentRandom] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPostIds, setNewPostIds] = useState(new Set());
  const [copyToast, setCopyToast] = useState(false);
  const copyTimerRef = useRef(null);

  const showCopyToast = useCallback(() => {
    setCopyToast(true);
    window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyToast(false), 1600);
  }, []);

  const refreshWall = useCallback((allPosts) => {
    setWallPosts(shuffle(allPosts).slice(0, MAX_POSTS));
  }, []);

  const nextRandom = useCallback((allPosts, current) => {
    const opts = allPosts.filter(p => p.id !== current?.id);
    const pool = opts.length ? opts : allPosts;
    setCurrentRandom(shuffle(pool)[0] || null);
  }, []);

useEffect(() => {
  fetchPosts();

  const channel = supabase
    .channel('addy-posts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'addy_posts',
      },
      () => {
        fetchPosts();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [fetchPosts]);

  useEffect(() => {
    const wallTimer = window.setInterval(() => refreshWall(posts), REFRESH_MS);
    const randomTimer = window.setInterval(() => nextRandom(posts, currentRandom), REFRESH_MS);

    return () => {
      window.clearInterval(wallTimer);
      window.clearInterval(randomTimer);
    };
  }, [posts, currentRandom, refreshWall, nextRandom]);

  useEffect(() => {
    return () => window.clearTimeout(copyTimerRef.current);
  }, []);

  useEffect(() => {
    if (!navigator?.clipboard?.writeText) return undefined;

    const clipboard = navigator.clipboard;
    const originalWriteText = clipboard.writeText.bind(clipboard);

    try {
      clipboard.writeText = async (text) => {
        const result = await originalWriteText(text);

        if (typeof text === 'string' && text.trim().length > 10) {
          showCopyToast();
        }

        return result;
      };

      return () => {
        clipboard.writeText = originalWriteText;
      };
    } catch (error) {
      return undefined;
    }
  }, [showCopyToast]);

const handleSubmit = async ({ btc_address, nickname, message }) => {
  const newPostPayload = {
    btc_address,
    nickname,
    message,
    reactions: { '🔥': 0, '⚡': 0, '💜': 0, '🙌': 0, '👑': 0, '💎': 0 },
  };

  const { data, error } = await supabase
    .from('addy_posts')
    .insert([newPostPayload])
    .select()
    .single();

  if (error) {
    console.error('Error posting addy:', error.message);
    alert('Failed to post addy. Check Supabase settings.');
    return;
  }

  setPosts(prev => {
    const updated = [data, ...prev];
    setWallPosts(shuffle(updated).slice(0, MAX_POSTS));
    return updated;
  });

  setCurrentRandom(prev => prev || data);

  setNewPostIds(prev => new Set([...prev, data.id]));

  window.setTimeout(() => {
    setNewPostIds(prev => {
      const s = new Set(prev);
      s.delete(data.id);
      return s;
    });
  }, 3000);
};

const handleReact = async (id, emoji) => {
  const targetPost = posts.find(p => p.id === id);
  if (!targetPost) return;

  const updatedReactions = {
    ...(targetPost.reactions || {}),
    [emoji]: ((targetPost.reactions || {})[emoji] || 0) + 1,
  };

  const { error } = await supabase
    .from('addy_posts')
    .update({ reactions: updatedReactions })
    .eq('id', id);

  if (error) {
    console.error('Error updating reaction:', error.message);
    return;
  }

  setPosts(prev =>
    prev.map(p =>
      p.id === id ? { ...p, reactions: updatedReactions } : p
    )
  );

  setWallPosts(prev =>
    prev.map(p =>
      p.id === id ? { ...p, reactions: updatedReactions } : p
    )
  );
};

  return (
    <div className="app-shell">
      <AnimatePresence>
        {copyToast && (
          <motion.div
            className="copy-toast"
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <span>✓</span> Addy copied
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        className="top-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <span className="brand-name">Wall of Addy</span>

        <motion.button
          className="post-button"
          onClick={() => setModalOpen(true)}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          + Post Addy
        </motion.button>
      </motion.nav>

      <motion.main
        className="app-main"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 24 }}
      >
        <div className="main-shine" />

        <div className="hero-row">
          <section className="hero-copy">
            <h1>
              Drop Your<br />
              <motion.span
                animate={{
                  textShadow: [
                    '0 0 20px rgba(255,115,0,.3)',
                    '0 0 45px rgba(255,115,0,.6)',
                    '0 0 20px rgba(255,115,0,.3)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                BTC Addy
              </motion.span>
              <br />on the Wall
            </h1>

            <p>
              A public Bitcoin address board where anyone can post their addy,
              leave a message, and maybe receive some sats.
            </p>

            <div className="hero-pills">
              <span>free to post</span>
              <span>no signup</span>
              <span>sats welcome</span>
            </div>
          </section>

          <HeroDecor />

          <aside className="random-card-wrap">
            <RandomCard
              post={currentRandom}
              onNext={() => nextRandom(posts, currentRandom)}
              onCopy={showCopyToast}
            />
          </aside>
        </div>

        <div className="refresh-note">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          >
            ↻
          </motion.span>
          Wall refreshes every 10 minutes
        </div>

        <motion.div layout className="wall-grid">
          <AnimatePresence>
            {wallPosts.map((post, i) => (
              <AddyCard
                key={post.id}
                post={post}
                onReact={handleReact}
                onCopy={showCopyToast}
                index={i}
                isNew={newPostIds.has(post.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="footer-pill-wrap">
          <span>No signups. No profiles. Just addys and sats.</span>
        </div>
      </motion.main>

      <PostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}