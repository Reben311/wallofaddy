import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

const REACTIONS = ['🔥', '⚡', '💜', '🙌', '👑', '💎'];

function shorten(addr) {
  if (!addr) return '';
  return addr.length > 12 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr;
}

export default function AddyCard({ post, onReact, index = 0 }) {
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [qrFlip, setQrFlip] = useState(false);
  const holdRef = useRef(null);

  const copy = () => {
    navigator.clipboard.writeText(post.btc_address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

const downloadQR = () => {
  const canvas = document.querySelector(`#qr-${post.id} canvas`);
  if (!canvas) return;

  const pngUrl = canvas.toDataURL('image/png');

  const a = document.createElement('a');
  a.href = pngUrl;
  a.download = `qr-${shorten(post.btc_address)}.png`;
  a.click();
};

  const topReactions = Object.entries(post.reactions || {})
    .filter(([, c]) => c > 0)
    .slice(0, 3);

  return (
    <motion.div
      className="addy-card"
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      transition={{ delay: index * 0.04, duration: 0.42, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={{ y: -3, boxShadow: '0 12px 36px rgba(0,0,0,.5), inset 0 1.5px 0 rgba(255,255,255,.22)' }}
      style={{
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,.12)',
        background: 'linear-gradient(150deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,.02) 45%,rgba(0,0,0,.10) 100%),rgba(22,22,28,.65)',
        backdropFilter: 'blur(24px) saturate(160%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        padding: '12px 14px 11px 13px',
        position: 'relative',
        overflow: 'visible',
        cursor: 'default',
      }}
    >
      {/* Left */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Address row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#fff', letterSpacing: 0.3 }}>
            {shorten(post.btc_address)}
          </span>
          <motion.button
            onClick={copy}
            whileTap={{ scale: 0.8 }}
            style={{
              background: 'transparent', border: 'none', color: copied ? '#ff7300' : 'rgba(255,255,255,.45)',
              cursor: 'pointer', fontSize: 13, padding: '0 2px', fontFamily: 'inherit',
              transition: 'color .15s',
            }}
            title="Copy address"
          >
            {copied ? '✓' : '⧉'}
          </motion.button>
        </div>

        {/* Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 130 }}>
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
    {post.message || 'leave sats'}
  </div>
</div>

        {/* Reactions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {topReactions.map(([emoji, count], ri) => (
            <motion.span
              key={emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                fontSize: 10, color: ri === 0 ? '#ff7300' : ri === 1 ? '#4fc' : '#b088f8',
                display: 'flex', alignItems: 'center', gap: 2,
              }}
            >
              {emoji} {count}
            </motion.span>
          ))}

          {/* Heart/Picker btn */}
          <div style={{ position: 'relative' }}>
            <motion.button
              onMouseDown={() => { holdRef.current = setTimeout(() => setPickerOpen(true), 280); }}
              onMouseUp={() => clearTimeout(holdRef.current)}
              onMouseLeave={() => clearTimeout(holdRef.current)}
              onTouchStart={() => { holdRef.current = setTimeout(() => setPickerOpen(true), 280); }}
              onTouchEnd={() => clearTimeout(holdRef.current)}
              onClick={() => setPickerOpen(p => !p)}
              whileTap={{ scale: 0.75 }}
              style={{
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,.4)',
                cursor: 'pointer', fontSize: 11, padding: '0 1px', fontFamily: 'inherit',
                transition: 'color .15s',
              }}
            >
              ♥
            </motion.button>

            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: 6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(22,22,28,.95)', border: '1px solid rgba(255,255,255,.18)',
                    borderRadius: 12, padding: '7px 10px', display: 'flex', gap: 6,
                    backdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0,0,0,.55)',
                    zIndex: 100, marginBottom: 6,
                  }}
                >
                  {REACTIONS.map(emoji => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.35 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => { onReact(post.id, emoji); setPickerOpen(false); }}
                      style={{
                        background: 'transparent', border: 'none', fontSize: 16,
                        cursor: 'pointer', padding: 2,
                      }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* QR */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginLeft: 10 }}>
        <motion.div
          id={`qr-${post.id}`}
          animate={qrFlip ? { rotateY: 360 } : {}}
          transition={{ duration: 0.5 }}
          onClick={() => setQrFlip(f => !f)}
          style={{ cursor: 'pointer', borderRadius: 5, overflow: 'hidden', background: '#fff', padding: 2 }}
        >
          <QRCodeCanvas
  value={`bitcoin:${post.btc_address}`}
  size={240}
  bgColor="#ffffff"
  fgColor="#000000"
  level="H"
  includeMargin={true}
  style={{
    width: 48,
    height: 48,
    display: 'block',
  }}
/>
        </motion.div>
        <motion.button
          onClick={downloadQR}
          whileHover={{ color: '#fff' }}
          whileTap={{ scale: 0.85 }}
          title="Download QR"
          style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,.38)',
            cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}
