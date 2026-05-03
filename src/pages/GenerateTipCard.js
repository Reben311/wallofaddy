import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';

function shortenAddress(addr) {
  if (!addr) return '';
  return addr.length > 18 ? `${addr.slice(0, 9)}...${addr.slice(-7)}` : addr;
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

export default function GenerateTipCard() {
  const cardRef = useRef(null);
  const inputRef = useRef(null);

  const [btc, setBtc] = useState('');
  const [nick, setNick] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanBtc = btc.trim();
  const cleanNick = nick.trim() || 'anon';
  const cleanMsg = msg.trim() || 'leave sats';
  const qrValue = cleanBtc ? `bitcoin:${cleanBtc}` : 'bitcoin:bc1qexample';
  const shortAddress = shortenAddress(cleanBtc || 'bc1qexampleaddress');

  const handleGenerate = () => {
    if (!cleanBtc) {
      setError('BTC address is required');
      inputRef.current?.focus();
      return;
    }

    setError('');
    setGenerated(true);
  };

  const handleCopyAddy = async () => {
    const success = await copyText(cleanBtc);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      alert(`Copy manually:\n${cleanBtc}`);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#07070a',
      });

      const link = document.createElement('a');
      link.download = `wall-of-addy-tip-card-${cleanNick}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export tip card:', error);
      alert('Could not download PNG.');
    }
  };

  return (
    <div className="app-shell">
      <motion.nav
        className="top-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <a href="/" className="brand-name nav-brand-link">
          Wall of Addy
        </a>

        <div className="nav-actions">
          <a href="/" className="post-button nav-link-button">
            Back to Wall
          </a>
        </div>
      </motion.nav>

      <motion.main
        className="app-main generate-page-main"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 24 }}
      >
        <div className="main-shine" />

        <section className="generate-page-hero">
          <div>
            <p className="generate-eyebrow">Generate Tip Card</p>

            <h1>
              Make a BTC<br />
              <span>tip card</span>
            </h1>

            <p>
              Create a clean shareable card with your BTC QR. This page does not post
              anything to the wall.
            </p>

            <div className="hero-pills">
              <span>no signup</span>
              <span>not posted</span>
              <span>download PNG</span>
            </div>
          </div>
        </section>

        <section className="generate-tip-layout">
          <motion.div
            className="generate-form-card"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16, type: 'spring', stiffness: 220, damping: 24 }}
          >
            <div className="post-modal-header generate-form-header">
              <div>
                <h2>Card Details</h2>
                <p>Fill this out, then generate your tip card.</p>
              </div>
            </div>

            <div className="post-form">
              <div>
                <label>BTC ADDRESS *</label>
                <motion.input
                  ref={inputRef}
                  value={btc}
                  onChange={(e) => {
                    setBtc(e.target.value);
                    setError('');
                    setGenerated(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  animate={error ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  placeholder="bc1q..."
                />

                {error && (
                  <motion.p
                    className="form-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <div>
                <label>NICKNAME (optional)</label>
                <input
                  value={nick}
                  onChange={(e) => {
                    setNick(e.target.value);
                    setGenerated(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="not_satoshi"
                />
              </div>

              <div>
                <label>MESSAGE (optional)</label>
                <textarea
                  value={msg}
                  onChange={(e) => {
                    setMsg(e.target.value);
                    setGenerated(false);
                  }}
                  placeholder="coffee fund ☕"
                  rows={3}
                />
              </div>

              <motion.button
                onClick={handleGenerate}
                whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(255,115,0,.35)' }}
                whileTap={{ scale: 0.97 }}
                className="submit-post-btn"
              >
                + GENERATE TIP CARD
              </motion.button>

              <p className="post-note">
                This only generates a card. Nothing is saved to the database.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="generate-preview-panel"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 24 }}
          >
            <div ref={cardRef} className="share-card-preview tip-card-preview">
              <div className="share-logo-mini">₿</div>

              <p className="share-eyebrow">Wall of Addy</p>

              <h2>
                Tip me in<br />
                <span>Bitcoin.</span>
              </h2>

              <p className="share-subtitle">
                Scan the QR or copy the address to send sats directly.
              </p>

              <div className="share-post-box">
                <div>
                  <strong>@{cleanNick}</strong>
                  <p>{shortAddress}</p>
                  <small>{cleanMsg}</small>
                </div>

                <div className="share-qr-real">
                  <QRCodeCanvas
                    value={qrValue}
                    size={96}
                    bgColor="#ffffff"
                    fgColor="#111111"
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="share-card-footer">
                <span>BTC only</span>
                <span>QR tip card</span>
                <span>Made on Wall of Addy</span>
              </div>
            </div>

            <AnimatePresence>
              {generated && (
                <motion.div
                  className="generate-success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  Tip card ready ⚡
                </motion.div>
              )}
            </AnimatePresence>

            <div className="share-actions generate-actions">
              <button onClick={handleCopyAddy} disabled={!cleanBtc}>
                {copied ? 'Copied ✓' : 'Copy addy'}
              </button>

              <button onClick={downloadCard} disabled={!cleanBtc}>
                Download PNG
              </button>

              <a href="/" className="generate-wall-link">
                Go to wall
              </a>
            </div>

            <p className="share-url">
              Private generator. It will not appear on the wall unless the user posts from the main page.
            </p>
          </motion.div>
        </section>
      </motion.main>
    </div>
  );
}