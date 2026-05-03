import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

const REACTIONS = ['🔥', '⚡', '💜', '🙌', '👑', '💎'];

function shorten(addr) {
  if (!addr) return '';
  return addr.length > 12 ? addr.slice(0, 6) + '...' + addr.slice(-4) : addr;
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

export default function AddyCard({ post, onReact, onCopy, onLinkCopied, index = 0 }) {
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [qrFlip, setQrFlip] = useState(false);
  const holdRef = useRef(null);

  const copy = async () => {
    const success = await copyText(post.btc_address);

    if (success) {
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 1500);
    } else {
      alert(`Copy manually:\n${post.btc_address}`);
    }
  };

  const copyPostLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const success = await copyText(url);

    if (success) {
      onLinkCopied?.();
    } else {
      alert(`Copy this link:\n${url}`);
    }
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
    >
      <div className="addy-card-left">
        <div className="addy-address-row">
          <span>{shorten(post.btc_address)}</span>

          <motion.button
            onClick={copy}
            whileTap={{ scale: 0.8 }}
            className={copied ? 'icon-btn copied' : 'icon-btn'}
            title="Copy address"
          >
            {copied ? '✓' : '⧉'}
          </motion.button>

          <motion.button
            onClick={copyPostLink}
            whileTap={{ scale: 0.8 }}
            className="icon-btn"
            title="Copy profile link"
          >
            🔗
          </motion.button>
        </div>

        <div className="addy-meta">
          <div className="addy-nickname">@{post.nickname || 'anon'}</div>
          <div className="addy-message">{post.message || 'leave sats'}</div>
        </div>

        <div className="reaction-row">
          {topReactions.map(([emoji, count], ri) => (
            <motion.span
              key={emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                color: ri === 0 ? '#ff7300' : ri === 1 ? '#4fc' : '#b088f8',
              }}
            >
              {emoji} {count}
            </motion.span>
          ))}

          <div className="reaction-picker-wrap">
            <motion.button
              onMouseDown={() => { holdRef.current = setTimeout(() => setPickerOpen(true), 280); }}
              onMouseUp={() => clearTimeout(holdRef.current)}
              onMouseLeave={() => clearTimeout(holdRef.current)}
              onTouchStart={() => { holdRef.current = setTimeout(() => setPickerOpen(true), 280); }}
              onTouchEnd={() => clearTimeout(holdRef.current)}
              onClick={() => setPickerOpen(p => !p)}
              whileTap={{ scale: 0.75 }}
              className="heart-btn"
            >
              ♥
            </motion.button>

            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  className="reaction-picker"
                  initial={{ opacity: 0, scale: 0.7, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: 6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                >
                  {REACTIONS.map(emoji => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.35 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        onReact(post.id, emoji);
                        setPickerOpen(false);
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

      <div className="addy-qr-wrap">
        <motion.div
          id={`qr-${post.id}`}
          animate={qrFlip ? { rotateY: 360 } : {}}
          transition={{ duration: 0.5 }}
          onClick={() => setQrFlip(f => !f)}
          className="addy-qr"
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
          title="Download QR PNG"
          className="download-qr-btn"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}