import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { SectionLabel } from '../components/SectionLabel';
import { Sheet } from '../components/Sheet';
import { useAuth } from '../lib/auth';
import { useBook } from '../lib/book';
import {
  createChat,
  deleteChat,
  fetchMessages,
  listChats,
  saveUserMessage,
  starterPromptsFor,
  streamReply,
  type CounselChat,
  type CounselMessage,
} from '../lib/counsel';

export function Counsel() {
  const { session } = useAuth();
  const { baby, caregiver } = useBook();

  const [chats, setChats] = useState<CounselChat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CounselMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string>('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const loadChats = useCallback(async () => {
    if (!caregiver) return;
    const list = await listChats(caregiver.id);
    setChats(list);
    if (list.length && !activeId) setActiveId(list[0].id);
  }, [caregiver, activeId]);

  useEffect(() => { void loadChats(); }, [loadChats]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    void fetchMessages(activeId).then(setMessages);
  }, [activeId]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const starters = useMemo(
    () => starterPromptsFor(!baby?.birth_time, !!baby?.name, baby?.name ?? ''),
    [baby?.birth_time, baby?.name]
  );

  async function send(text: string) {
    if (!caregiver) {
      setErr('You need to be signed in.');
      return;
    }
    if (!text.trim()) return;
    setErr(null);
    setBusy(true);
    setInput('');

    try {
      let chat: CounselChat;
      if (activeId) {
        chat = chats.find((c) => c.id === activeId)!;
      } else {
        chat = await createChat(caregiver.id, baby?.id ?? null, text);
        setChats((prev) => [chat, ...prev]);
        setActiveId(chat.id);
      }

      const userMsg = await saveUserMessage(chat.id, text);
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setStreamingText('');

      const history = nextMessages.map((m) => ({ role: m.role, content: m.content }));
      abortRef.current = new AbortController();
      await streamReply(chat.id, history, (piece) => setStreamingText((prev) => prev + piece), abortRef.current.signal);

      // Once streaming is done the edge function saved the assistant row — refetch.
      const refreshed = await fetchMessages(chat.id);
      setMessages(refreshed);
      setStreamingText('');
      void loadChats();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  async function removeChat(id: string) {
    if (!confirm('Delete this conversation?')) return;
    await deleteChat(id);
    if (activeId === id) setActiveId(null);
    await loadChats();
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setStreamingText('');
    setInput('');
  }

  if (!session) return null;

  return (
    <div className="page" style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>chapter vi</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>
          <span className="accent">Counsel</span>
        </h1>
        <div className="editorial-sub">A gentle friend, on the other side of the page.</div>
        <div className="gold-rule" />
      </div>

      {/* Conversation list -------------------------------------------- */}
      {chats.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SectionLabel
            right={activeId ? (
              <button
                type="button"
                onClick={newChat}
                style={{
                  fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                  color: 'var(--gold-deep)', fontSize: 14,
                }}
              >
                + a new conversation
              </button>
            ) : undefined}
          >
            past conversations
          </SectionLabel>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 6,
              marginLeft: -22, paddingLeft: 22,
              marginRight: -22, paddingRight: 22,
            }}
          >
            {chats.map((c) => {
              const active = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  style={{
                    flexShrink: 0,
                    maxWidth: 260,
                    padding: '10px 14px',
                    borderRadius: 999,
                    background: active ? 'var(--ink)' : 'var(--parchment-warm)',
                    color: active ? 'var(--cream)' : 'var(--ink)',
                    border: active ? '1px solid var(--ink)' : '1px solid var(--rule)',
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.title ?? 'a conversation'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation or empty state -------------------------------- */}
      <div
        ref={scrollerRef}
        style={{
          minHeight: 240,
          maxHeight: '60dvh',
          overflowY: 'auto',
          padding: '6px 2px',
          marginBottom: 14,
        }}
      >
        {messages.length === 0 && !streamingText ? (
          <EmptyState starters={starters} onPick={(s) => send(s)} babyArrived={!!baby?.birth_time} />
        ) : (
          <>
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.content} />
            ))}
            {streamingText && <Bubble role="assistant" text={streamingText} streaming />}
          </>
        )}
      </div>

      {err && (
        <div
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            color: 'var(--gold-deep)', fontSize: 14,
            marginBottom: 10,
          }}
        >
          {err}
        </div>
      )}

      {/* Composer -------------------------------------------------- */}
      <Composer
        value={input}
        onChange={setInput}
        onSend={() => send(input)}
        onStop={stop}
        busy={busy}
      />

      {/* Footer: About link + delete (if active) --------------------- */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ink-mute)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          About Baby AI
        </button>

        {activeId && (
          <button
            type="button"
            onClick={() => removeChat(activeId)}
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--ink-mute)',
              fontSize: 14,
            }}
          >
            delete this conversation
          </button>
        )}
      </div>

      {/* Always-visible safety disclaimer ----------------------------- */}
      <div
        style={{
          marginTop: 14,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--ink-mute)',
          lineHeight: 1.5,
        }}
      >
        Not a doctor — if something frightens you about your body or his, call the person who can examine you both.
      </div>

      <AboutBabyAi open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

function AboutBabyAi({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="About Baby AI" eyebrow="what shapes this companion">
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 17,
          lineHeight: 1.6,
          color: 'var(--ink)',
          marginBottom: 18,
        }}
      >
        Baby AI is grounded in the work of Daniel Siegel, Kim John Payne, Gabor Maté, Shefali Tsabary, Deborah MacNamara, and Hunter Clarke-Fields.
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 17,
          lineHeight: 1.6,
          color: 'var(--ink)',
          marginBottom: 18,
        }}
      >
        It thinks in terms of polyvagal nervous-system care, Ayurveda's daily and seasonal rhythms, and the subtle energetic field between mother and baby.
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 16,
          lineHeight: 1.5,
          color: 'var(--ink-soft)',
          marginBottom: 22,
        }}
      >
        Not a doctor — if something frightens you about your body or his, call the person who can examine you both.
      </div>
      <Button onClick={onClose} size="md" block>
        Close
      </Button>
    </Sheet>
  );
}

function EmptyState({
  starters,
  onPick,
}: {
  starters: string[];
  onPick: (s: string) => void;
  babyArrived: boolean;
}) {
  return (
    <div>
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 26,
          lineHeight: 1.4,
          color: 'var(--ink)',
          padding: '28px 8px 24px',
        }}
      >
        Tell me where you are,
        <br />
        and what you'd like to think about.
      </div>

      <SectionLabel>a place to begin</SectionLabel>
      <div style={{ display: 'grid', gap: 8 }}>
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            style={{
              textAlign: 'left',
              background: 'var(--cream)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 16,
              color: 'var(--ink)',
              lineHeight: 1.4,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ role, text, streaming }: { role: 'user' | 'assistant'; text: string; streaming?: boolean }) {
  const isUser = role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: isUser ? '10px 14px' : '14px 16px',
          borderRadius: isUser ? 18 : 14,
          background: isUser ? 'var(--ink)' : 'var(--parchment-warm)',
          color: isUser ? 'var(--cream)' : 'var(--ink)',
          fontFamily: 'var(--font-serif)',
          fontStyle: isUser ? 'normal' : 'normal',
          fontSize: 17,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
        {streaming && (
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 6,
              height: 14,
              background: 'var(--gold)',
              marginLeft: 3,
              verticalAlign: 'text-bottom',
              animation: 'henri-cursor 1s ease-in-out infinite',
            }}
          />
        )}
      </div>
      <style>{`
        @keyframes henri-cursor { 0%, 100% { opacity: 0.2 } 50% { opacity: 1 } }
      `}</style>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
}) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !busy) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        background: 'var(--cream)',
        border: '1px solid var(--gold-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 12px',
      }}
    >
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Write freely. Enter to send, Shift + Enter for a new line."
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontFamily: 'var(--font-serif)',
          fontSize: 17,
          color: 'var(--ink)',
          minHeight: 36,
          maxHeight: 200,
          lineHeight: 1.4,
        }}
      />
      {busy ? (
        <Button variant="ghost" size="sm" onClick={onStop}>Stop</Button>
      ) : (
        <Button variant="primary" size="sm" onClick={onSend} disabled={!value.trim()}>
          Send
        </Button>
      )}
    </div>
  );
}
