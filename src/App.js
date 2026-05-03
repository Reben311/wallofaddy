import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';
import AddyCard from './components/AddyCard';
import RandomCard from './components/RandomCard';
import PostModal from './components/PostModal';
import { supabase } from './lib/supabase';
import GenerateTipCard from './pages/GenerateTipCard';

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

async function copyText(text) {
  if (!text) return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed. Using fallback.', err);
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.setAttribute('readonly', '');

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let success = false;

  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }

  document.body.removeChild(textarea);
  return success;
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

function ShareCardModal({ post, onClose, onOpenSharedPost, onLinkCopied }) {
  const cardRef = useRef(null);

  if (!post) return null;

  const postUrl = `${window.location.origin}/post/${post.id}`;
  const shortAddress =
    post.btc_address?.length > 16
      ? `${post.btc_address.slice(0, 8)}...${post.btc_address.slice(-6)}`
      : post.btc_address;

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#07070a',
      });

      const link = document.createElement('a');
      link.download = `wall-of-addy-${post.nickname || 'anon'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export share card:', error);
      alert('Could not download PNG.');
    }
  };

  const handleCopyLink = async () => {
    const success = await copyText(postUrl);

    if (success) {
      onLinkCopied?.();
    } else {
      alert(`Copy this link:\n${postUrl}`);
    }
  };

  const handleOpenPost = () => {
    window.history.pushState({}, '', `/post/${post.id}`);
    onOpenSharedPost(post.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="share-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="share-modal"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          <button className="share-close" onClick={onClose}>✕</button>

          <div ref={cardRef} className="share-card-preview">
            <div className="share-logo-mini">W</div>

            <p className="share-eyebrow">Wall of Addy</p>

            <h2>
              I dropped my addy<br />
              on <span>Wall of Addy.</span>
            </h2>

            <p className="share-subtitle">
              Turn your BTC address into a shareable tip card.
            </p>

            <div className="share-post-box">
              <div>
                <strong>@{post.nickname || 'anon'}</strong>
                <p>{shortAddress}</p>
                <small>{post.message || 'leave sats'}</small>
              </div>

              <div className="share-qr-real">
                <QRCodeCanvas
                  value={postUrl}
                  size={96}
                  bgColor="#ffffff"
                  fgColor="#111111"
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="share-card-footer">
              <span>No signup</span>
              <span>Free to post</span>
              <span>Share your link</span>
            </div>
          </div>

          <div className="share-actions">
            <button onClick={handleCopyLink}>Copy link</button>
            <button onClick={downloadCard}>Download PNG</button>
            <button onClick={handleOpenPost}>Open post</button>
          </div>

          <p className="share-url">{postUrl}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SharedPostModal({ open, post, loading, onClose, onReact, onCopy, onLinkCopied }) {
  if (!open) return null;

  const postUrl = post ? `${window.location.origin}/post/${post.id}` : window.location.href;

  const handleCopyLink = async () => {
    const success = await copyText(postUrl);

    if (success) {
      onLinkCopied?.();
    } else {
      alert(`Copy this link:\n${postUrl}`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="shared-post-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="shared-post-modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        >
          <button className="share-close" onClick={onClose}>✕</button>

          <div className="shared-post-header-row">
            <div>
              <span className="shared-post-label">Shared Addy</span>
              <h3>Wall of Addy</h3>
            </div>

            {!loading && post && (
              <button className="shared-post-copy-link" onClick={handleCopyLink}>
                Copy link
              </button>
            )}
          </div>

          {loading ? (
            <div className="shared-post-state">Loading shared post...</div>
          ) : post ? (
            <div className="shared-post-card-wrap">
              <AddyCard
                post={post}
                onReact={onReact}
                onCopy={onCopy}
                onLinkCopied={onLinkCopied}
                index={0}
                isNew={false}
              />
            </div>
          ) : (
            <div className="shared-post-state">This post was not found.</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function WallApp() {
  const [posts, setPosts] = useState([]);
  const [wallPosts, setWallPosts] = useState([]);
  const [currentRandom, setCurrentRandom] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPostIds, setNewPostIds] = useState(new Set());
  const [copyToast, setCopyToast] = useState(false);
  const [linkCopyToast, setLinkCopyToast] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [sharedPostModalOpen, setSharedPostModalOpen] = useState(false);
  const [lastPostedPost, setLastPostedPost] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const copyTimerRef = useRef(null);
  const linkCopyTimerRef = useRef(null);

  const showCopyToast = useCallback(() => {
    setCopyToast(true);
    window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyToast(false), 1600);
  }, []);

  const showLinkCopyToast = useCallback(() => {
    setLinkCopyToast(true);
    window.clearTimeout(linkCopyTimerRef.current);
    linkCopyTimerRef.current = window.setTimeout(() => setLinkCopyToast(false), 1600);
  }, []);

  const refreshWall = useCallback((allPosts) => {
    setWallPosts(shuffle(allPosts).slice(0, MAX_POSTS));
  }, []);

  const nextRandom = useCallback((allPosts, current) => {
    const opts = allPosts.filter(p => p.id !== current?.id);
    const pool = opts.length ? opts : allPosts;
    setCurrentRandom(shuffle(pool)[0] || null);
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);

    const { data, error } = await supabase
      .from('addy_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error.message);
      setLoadingPosts(false);
      return;
    }

    const realPosts = data || [];

    setPosts(realPosts);
    setWallPosts(shuffle(realPosts).slice(0, MAX_POSTS));
    setCurrentRandom(shuffle(realPosts)[0] || null);
    setLoadingPosts(false);
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
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  useEffect(() => {
    const path = window.location.pathname;

    if (path.startsWith('/post/')) {
      const id = decodeURIComponent(path.replace('/post/', '').trim());

      if (id) {
        setSelectedPostId(id);
        setSharedPostModalOpen(true);
      }
    }
  }, []);

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

  const openSharedPostModal = (id) => {
    if (!id) return;
    setSelectedPostId(id);
    setSharedPostModalOpen(true);
  };

  const closeSharedPostModal = () => {
    window.history.pushState({}, '', '/');
    setSelectedPostId(null);
    setSharedPostModalOpen(false);
  };

  const selectedSharedPost = posts.find((p) => p.id === selectedPostId) || null;

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
      return null;
    }

    setPosts((prev) => {
      const updated = [data, ...prev];
      setWallPosts(shuffle(updated).slice(0, MAX_POSTS));
      return updated;
    });

    setCurrentRandom((prev) => prev || data);

    window.setTimeout(() => {
      setLastPostedPost(data);
    }, 1200);

    setNewPostIds((prev) => new Set([...prev, data.id]));

    window.setTimeout(() => {
      setNewPostIds((prev) => {
        const s = new Set(prev);
        s.delete(data.id);
        return s;
      });
    }, 3000);

    return data;
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
      prev.map(p => p.id === id ? { ...p, reactions: updatedReactions } : p)
    );

    setWallPosts(prev =>
      prev.map(p => p.id === id ? { ...p, reactions: updatedReactions } : p)
    );
  };

  return (
    <div className="app-shell">
      <AnimatePresence>
        {copyToast && (
          <div className="copy-toast-wrap">
            <motion.div
              className="copy-toast"
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <span>✓</span> Addy copied
            </motion.div>
          </div>
        )}
        {linkCopyToast && (
          <div className="copy-toast-wrap">
            <motion.div
              className="copy-toast"
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              <span>✓</span> Link copied
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.nav
        className="top-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <span className="brand-name">Wall of Addy</span>

<div className="nav-actions">
  <a href="/generate-tip-card" className="post-button nav-link-button">
    Generate Tip Card
  </a>

  <motion.button
    className="post-button"
    onClick={() => setModalOpen(true)}
    whileHover={{ y: -2, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
  >
    + Post Addy
  </motion.button>
</div>
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
                Turn your BTC address into a shareable tip card. Post your addy,
  leave a message, and maybe catch some sats.
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

        {loadingPosts && (
          <div className="empty-state">Loading addys...</div>
        )}

        {!loadingPosts && wallPosts.length === 0 && (
          <div className="empty-state">No addys yet. Be the first one on the wall.</div>
        )}

        <motion.div layout className="wall-grid">
          <AnimatePresence>
            {wallPosts.map((post, i) => (
              <AddyCard
                key={post.id}
                post={post}
                onReact={handleReact}
                onCopy={showCopyToast}
                onLinkCopied={showLinkCopyToast}
                index={i}
                isNew={newPostIds.has(post.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

<div className="footer-pill-wrap">
  <span>
    Wall of Addy never holds crypto. QR codes are generated directly from user-submitted BTC addresses.
  </span>
</div>
      </motion.main>

      <PostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ShareCardModal
        post={lastPostedPost}
        onClose={() => setLastPostedPost(null)}
        onOpenSharedPost={openSharedPostModal}
        onLinkCopied={showLinkCopyToast}
      />

      <SharedPostModal
        open={sharedPostModalOpen}
        post={selectedSharedPost}
        loading={loadingPosts}
        onClose={closeSharedPostModal}
        onReact={handleReact}
        onCopy={showCopyToast}
        onLinkCopied={showLinkCopyToast}
      />
    </div>
  );
}
export default function App() {
  const path = window.location.pathname;

  if (path === '/generate-tip-card') {
    return <GenerateTipCard />;
  }

  return <WallApp />;
}