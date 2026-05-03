import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostModal({ open, onClose, onSubmit }) {
  const [btc, setBtc] = useState('');
  const [nick, setNick] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef();

  const reset = () => {
    setBtc('');
    setNick('');
    setMsg('');
    setError('');
    setSuccess(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const cleanAddress = btc.trim();

    if (!cleanAddress) {
      setError('BTC address is required');
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);

    const result = await onSubmit({
      btc_address: cleanAddress,
      nickname: nick.trim(),
      message: msg.trim(),
    });

    setSubmitting(false);

    if (!result) {
      setError('Failed to post addy');
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      handleClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="post-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            className="post-modal"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="post-modal-header">
              <div>
                <h2>Post Your Addy</h2>
                <p>Drop your Bitcoin address on the wall</p>
              </div>

              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.15, color: '#fff' }}
                whileTap={{ scale: 0.85 }}
              >
                ✕
              </motion.button>
            </div>

            {success ? (
              <motion.div
                className="post-success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -8, 8, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  ₿
                </motion.div>
                <p>Addy posted!</p>
                <span>Opening share card ⚡</span>
              </motion.div>
            ) : (
              <div className="post-form">
                <div>
                  <label>BTC ADDRESS *</label>
                  <motion.input
                    ref={inputRef}
                    value={btc}
                    onChange={e => {
                      setBtc(e.target.value);
                      setError('');
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
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
                    onChange={e => setNick(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="not_satoshi"
                  />
                </div>

                <div>
                  <label>MESSAGE (optional)</label>
                  <textarea
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    placeholder="coffee fund ☕"
                    rows={3}
                  />
                </div>

                <motion.button
                  onClick={handleSubmit}
                  disabled={submitting}
                  whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(255,115,0,.35)' }}
                  whileTap={{ scale: 0.97 }}
                  className="submit-post-btn"
                >
                  {submitting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      >
                        ₿
                      </motion.span>
                      Posting...
                    </>
                  ) : '+ POST TO WALL'}
                </motion.button>

                <p className="post-note">No signups. No profiles. Just addys.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}