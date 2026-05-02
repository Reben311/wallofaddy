import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

function shorten(addr) {
  if (!addr) return '';
  return addr.length > 12 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr;
}

export default function RandomCard({ post, onNext }) {
  const [copied, setCopied] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [key, setKey] = useState(0);

  const copy = () => {
    if (!post) return;
    navigator.clipboard.writeText(post.btc_address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleNext = () => {
    setFlipping(true);
    setKey(k => k + 1);
    setTimeout(() => { onNext(); setFlipping(false); }, 380);
  };

  return (
    <div style={{
      width: 262,
      flexShrink: 0,
      borderRadius: 18,
      padding: '14px 14px 12px',
      border: '1px solid rgba(255,255,255,.17)',
      background: 'linear-gradient(145deg,rgba(255,255,255,.11) 0%,rgba(255,255,255,.04) 50%,rgba(0,0,0,.10) 100%),rgba(22,22,28,.58)',
      backdropFilter: 'blur(32px) saturate(180%) brightness(1.1)',
      boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.20),0 8px 32px rgba(0,0,0,.50)',
    }}>
      <h3 style={{ fontSize: 11, fontWeight: 400, color: '#fff', textAlign: 'center', letterSpacing: 0.5, marginBottom: 1 }}>
        Random Addy of the Moment
      </h3>
      <p style={{ fontSize: 9, color: 'rgba(255,255,255,.45)', textAlign: 'center', marginBottom: 10, letterSpacing: 0.3 }}>
        ( refreshes every 10 minutes )
      </p>

      <AnimatePresence mode="wait">
        {post && (
          <motion.div
            key={key}
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}
            style={{
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,.13)',
              background: 'linear-gradient(135deg,rgba(255,255,255,.07) 0%,rgba(0,0,0,.18) 100%),rgba(10,10,14,.68)',
              backdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 11px', gap: 8, minHeight: 72,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#fff', whiteSpace: 'nowrap' }}>
                  {shorten(post.btc_address)}
                </span>
                <motion.button
                  onClick={copy}
                  whileTap={{ scale: 0.7 }}
                  style={{
                    background: 'transparent', border: 'none',
                    color: copied ? '#ff7300' : 'rgba(255,255,255,.45)',
                    cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'inherit',
                    transition: 'color .15s',
                  }}
                >
                  {copied ? '✓' : '⧉'}
                </motion.button>
              </div>
<div style={{ marginTop: 3, maxWidth: 120 }}>
  <div style={{
    fontSize: 10,
    color: '#ff7300',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }}>
    @{post.nickname || 'anon'}
  </div>

  <div style={{
    fontSize: 11,
    color: 'rgba(255,255,255,.65)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }}>
    {post.message || 'coffee fund ☕'}
  </div>
</div>
            </div>

            <div style={{ flexShrink: 0 }}>
              <div style={{ borderRadius: 5, overflow: 'hidden', background: '#fff', padding: 2 }}>
                <QRCodeCanvas
  value={`bitcoin:${post.btc_address}`}
  size={240}
  bgColor="#ffffff"
  fgColor="#000000"
  level="H"
  includeMargin={true}
  style={{
    width: 44,
    height: 44,
    display: 'block',
  }}
/>
              </div>
              <motion.button
                whileHover={{ color: 'rgba(255,255,255,.9)', y: 2 }}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,.35)',
                  cursor: 'pointer', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', marginTop: 4,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleNext}
        whileHover={{ y: -1, borderColor: 'rgba(255,255,255,.30)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'block', width: '100%', height: 22, marginTop: 10,
          borderRadius: 999, border: '1px solid rgba(255,255,255,.16)',
          background: 'linear-gradient(180deg,rgba(255,255,255,.13) 0%,rgba(255,255,255,.04) 100%),rgba(60,60,70,.42)',
          backdropFilter: 'blur(12px)',
          color: 'rgba(255,255,255,.75)', fontSize: 9, letterSpacing: 0.5,
          cursor: 'pointer',
        }}
      >
        next random addy
      </motion.button>
    </div>
  );
}
