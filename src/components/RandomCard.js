import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';

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

export default function RandomCard({ post, onNext, onCopy }) {
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  const copy = async () => {
    if (!post) return;

    const success = await copyText(post.btc_address);

    if (success) {
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 1500);
    } else {
      alert(`Copy manually:\n${post.btc_address}`);
    }
  };

  const handleNext = () => {
    setKey(k => k + 1);
    setTimeout(() => onNext(), 280);
  };

  return (
    <div className="random-card">
      <h3>Random Addy of the Moment</h3>

      <p className="random-subtitle">
        ( refreshes every 10 minutes )
      </p>

      <AnimatePresence mode="wait">
        {post && (
          <motion.div
            key={key}
            className="random-inner"
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}
          >
            <div className="random-info">
              <div className="random-address-row">
                <span>{shorten(post.btc_address)}</span>

                <motion.button
                  onClick={copy}
                  whileTap={{ scale: 0.7 }}
                  className={copied ? 'icon-btn copied' : 'icon-btn'}
                >
                  {copied ? '✓' : '⧉'}
                </motion.button>
              </div>

              <div className="random-meta">
                <div>@{post.nickname || 'anon'}</div>
                <span>{post.message || 'coffee fund ☕'}</span>
              </div>
            </div>

            <div className="random-qr">
              <div>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleNext}
        whileHover={{ y: -1, borderColor: 'rgba(255,255,255,.30)' }}
        whileTap={{ scale: 0.97 }}
        className="random-next"
      >
        next random addy
      </motion.button>
    </div>
  );
}