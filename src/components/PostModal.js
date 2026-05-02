import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostModal({ open, onClose, onSubmit }) {
  const [btc, setBtc] = useState('');
  const [nick, setNick] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef();

  const reset = () => {
    setBtc(''); setNick(''); setMsg('');
    setError(false); setSuccess(false); setSubmitting(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!btc.trim()) { setError(true); inputRef.current?.focus(); return; }
    setSubmitting(true);
await onSubmit({
  btc_address: btc.trim(),
  nickname: nick.trim(),
  message: msg.trim(),
});
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => { handleClose(); }, 1200);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            style={{
              width: '100%', maxWidth: 440,
              borderRadius: 22,
              border: '1px solid rgba(255,255,255,.18)',
              background: 'linear-gradient(145deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,.04) 50%,rgba(0,0,0,.12) 100%),rgba(18,18,24,.92)',
              backdropFilter: 'blur(48px) saturate(200%)',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,.18),0 32px 80px rgba(0,0,0,.75)',
              padding: '28px 28px 24px',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 400, color: '#fff', letterSpacing: 1 }}>Post Your Addy</h2>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 3, letterSpacing: 0.5 }}>
                  Drop your Bitcoin address on the wall
                </p>
              </div>
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.15, color: '#fff' }}
                whileTap={{ scale: 0.85 }}
                style={{
                  background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)',
                  borderRadius: '50%', width: 30, height: 30,
                  color: 'rgba(255,255,255,.55)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                ✕
              </motion.button>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '30px 0' }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -8, 8, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  style={{ fontSize: 48, marginBottom: 12 }}
                >
                  ₿
                </motion.div>
                <p style={{ color: '#ff7300', fontSize: 16, letterSpacing: 1 }}>Addy posted!</p>
                <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 4 }}>
                  Now live on the wall ⚡
                </p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* BTC Address */}
                <div>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                    BTC ADDRESS *
                  </label>
                  <motion.input
                    ref={inputRef}
                    value={btc}
                    onChange={e => { setBtc(e.target.value); setError(false); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    animate={error ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    placeholder="bc1q..."
                    style={{
                      width: '100%', height: 44, padding: '0 14px',
                      borderRadius: 10,
                      border: `1px solid ${error ? 'rgba(255,80,80,.6)' : 'rgba(255,255,255,.16)'}`,
                      background: 'rgba(255,255,255,.06)',
                      color: '#fff', fontSize: 12, letterSpacing: 0.5,
                      outline: 'none',
                      transition: 'border-color .2s',
                    }}
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ fontSize: 10, color: 'rgba(255,100,100,.9)', marginTop: 4 }}
                    >
                      BTC address is required
                    </motion.p>
                  )}
                </div>

                {/* Nickname */}
                <div>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                    NICKNAME (optional)
                  </label>
                  <input
                    value={nick}
                    onChange={e => setNick(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="satoshi"
                    style={{
                      width: '100%', height: 44, padding: '0 14px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,.12)',
                      background: 'rgba(255,255,255,.05)',
                      color: '#fff', fontSize: 12,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                    MESSAGE (optional)
                  </label>
                  <textarea
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    placeholder="coffee fund ☕"
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,.12)',
                      background: 'rgba(255,255,255,.05)',
                      color: '#fff', fontSize: 12,
                      outline: 'none', resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Submit */}
                <motion.button
                  onClick={handleSubmit}
                  disabled={submitting}
                  whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(255,115,0,.35)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', height: 46, borderRadius: 999,
                    border: '1px solid rgba(255,115,0,.5)',
                    background: submitting
                      ? 'rgba(255,115,0,.3)'
                      : 'linear-gradient(180deg,rgba(255,115,0,.45) 0%,rgba(255,115,0,.25) 100%)',
                    color: '#fff', fontSize: 13, letterSpacing: 1.5,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    marginTop: 4,
                    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {submitting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        style={{ display: 'inline-block', fontSize: 16 }}
                      >
                        ₿
                      </motion.span>
                      Posting...
                    </>
                  ) : '+ POST TO WALL'}
                </motion.button>

                <p style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,.3)', letterSpacing: 0.5 }}>
                  No signups. No profiles. Just addys.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
