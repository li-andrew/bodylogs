import { useState, useRef } from 'react';
import { parseFoodEntry } from '../../lib/claudeParser';
import styles from './FoodChat.module.css';

const EXAMPLES = [
  'bowl of tonkotsu ramen with chashu pork',
  'plate of pad thai with shrimp',
  'bibimbap with beef and fried egg',
  'dim sum — 3 har gow and 2 siu mai',
];

export default function FoodChat({ onAddMany }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  async function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const entries = await parseFoodEntry(trimmed);
      onAddMany(entries.map(e => ({ ...e, fromAI: true })));
      setText('');
      setStatus('idle');
      if (inputRef.current) inputRef.current.style.height = '';
    } catch (err) {
      console.error('Food parse error:', err);
      setErrorMsg(err.message?.includes('API key') ? 'Missing API key — see .env setup.' : `Error: ${err.message}`);
      setStatus('error');
    }

    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function fillExample(ex) {
    setText(ex);
    requestAnimationFrame(() => {
      if (inputRef.current) autoResize(inputRef.current);
      inputRef.current?.focus();
    });
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.badge}>AI</span>
        <h2 className={styles.heading}>What did you eat?</h2>
      </div>

      <div className={styles.examples}>
        {EXAMPLES.map(ex => (
          <button key={ex} type="button" className={styles.example} onClick={() => fillExample(ex)}>
            {ex}
          </button>
        ))}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={text}
          onChange={e => { setText(e.target.value); setStatus('idle'); autoResize(e.target); }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. grilled chicken breast with roasted vegetables"
          rows={2}
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!text.trim() || status === 'loading'}
        >
          {status === 'loading' ? <Spinner /> : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </form>

      {status === 'error' && (
        <p className={styles.error}>{errorMsg}</p>
      )}
    </section>
  );
}

function Spinner() {
  return <span className={styles.spinner} aria-label="Parsing..." />;
}
