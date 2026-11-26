import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send } from 'lucide-react';
import { getMessages, markMessageRead, sendMessage } from '../features/messages/messagesApi';
import { useAuth } from '../features/auth/AuthContext';

// این صفحه فهرست گفتگوها را تازه نگه می‌دارد و پیام خوانده‌نشده را ثبت می‌کند
export default function MessagesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useOutletContext();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(null);
  const [target, setTarget] = useState(location.state?.target || null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const openedNotification = useRef(null);
  const locale = { fa: 'fa-AF', ps: 'ps-AF', en: 'en-US' }[i18n.resolvedLanguage || 'en'];

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const data = await getMessages();
        if (mounted) setMessages(data.messages || []);
      } catch (error) {
        if (mounted) toast(t(error.message));
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [t, toast]);

  const conversations = useMemo(() => {
    const latestByPeer = new Map();
    [...messages]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach((message) => {
        const peerId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        if (!latestByPeer.has(peerId)) latestByPeer.set(peerId, message);
      });
    return [...latestByPeer.values()];
  }, [messages, user.id]);

  const peerId = active
    ? active.sender_id === user.id
      ? active.recipient_id
      : active.sender_id
    : null;
  const peerName =
    target?.seller_name ||
    (active?.sender_id === user.id ? active?.recipient_name : active?.sender_name);
  const thread = messages
    .filter(
      (message) =>
        (message.sender_id === user.id && message.recipient_id === peerId) ||
        (message.recipient_id === user.id && message.sender_id === peerId),
    )
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  async function openConversation(message) {
    setActive(message);
    setTarget(null);
    const selectedPeerId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
    const unread = messages.filter(
      (item) => item.recipient_id === user.id && item.sender_id === selectedPeerId && !item.read_at,
    );
    if (!unread.length) return;
    setMessages((current) =>
      current.map((item) =>
        unread.some(({ id }) => id === item.id)
          ? { ...item, read_at: new Date().toISOString() }
          : item,
      ),
    );
    await Promise.all(unread.map(({ id }) => markMessageRead(id).catch(() => null)));
  }

  useEffect(() => {
    const messageId = location.state?.messageId;
    if (!messageId || openedNotification.current === messageId) return;
    const selected = messages.find(({ id }) => id === messageId);
    if (selected) {
      openedNotification.current = messageId;
      openConversation(selected);
    }
  }, [location.state, messages]);

  async function send(event) {
    event.preventDefault();
    if (!text.trim() || (!active && !target)) return;
    const recipientId = target ? target.seller_id : peerId;
    if (!recipientId) {
      toast(t('This demo listing has no live seller account.'));
      return;
    }
    setBusy(true);
    try {
      const { message } = await sendMessage({
        recipientId,
        listingId: target?.id || active?.listing_id || null,
        body: text.trim(),
      });
      setMessages((current) => [...current.filter(({ id }) => id !== message.id), message]);
      setActive(message);
      setText('');
      setTarget(null);
    } catch (error) {
      toast(t(error.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
      <header className="mb-5">
        <div className="text-[11px] font-extrabold uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">
          {t('YOUR MOTRLY')}
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          {t('Messages')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('Stay in touch with buyers and sellers.')}</p>
      </header>

      <section className="grid min-h-[65vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-[320px_1fr] dark:border-slate-800 dark:bg-slate-900">
        <aside className="border-b border-slate-200 md:border-b-0 md:border-e dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <b className="text-sm dark:text-white">{t('Inbox')}</b>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800">
              {conversations.length}
            </span>
          </div>
          {conversations.map((message) => {
            const outgoing = message.sender_id === user.id;
            const name = outgoing ? message.recipient_name : message.sender_name;
            const id = outgoing ? message.recipient_id : message.sender_id;
            const unread = message.recipient_id === user.id && !message.read_at;
            return (
              <button
                key={id}
                onClick={() => openConversation(message)}
                className={`flex w-full items-center gap-3 border-b border-slate-100 p-4 text-start transition dark:border-slate-800 ${peerId === id ? 'bg-amber-50 dark:bg-amber-300/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {name?.[0] || 'M'}
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm text-slate-900 dark:text-white">{name}</b>
                  <small className="mt-1 block truncate text-xs text-slate-500">
                    {message.body}
                  </small>
                </span>
                {unread && (
                  <span
                    className="size-2 shrink-0 rounded-full bg-amber-500"
                    aria-label={t('Unread message')}
                  />
                )}
                <time className="text-[10px] text-slate-400">
                  {new Date(message.created_at).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </button>
            );
          })}
          {!conversations.length && (
            <div className="p-6 text-center text-sm leading-6 text-slate-500">
              {t('No messages yet.')}
              <br />
              {t('Open a vehicle listing to contact a seller.')}
            </div>
          )}
        </aside>

        <div className="flex min-h-[55vh] flex-col">
          {active || target ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <span className="grid size-10 place-items-center rounded-xl bg-amber-100 font-extrabold text-amber-900 dark:bg-amber-300/15 dark:text-amber-200">
                  {peerName?.[0] || 'M'}
                </span>
                <div>
                  <b className="block text-sm dark:text-white">{peerName || t('Motrly seller')}</b>
                  <small className="text-xs text-slate-500">
                    {target ? target.title : t('Motrly member')}
                  </small>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
                {thread.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_id === user.id ? 'ms-auto rounded-ee-sm bg-amber-400 text-slate-950' : 'me-auto rounded-es-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    {message.body}
                    <small className="mt-1 block text-end text-[10px] opacity-60">
                      {new Date(message.created_at).toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                ))}
              </div>
              <form
                onSubmit={send}
                className="flex gap-2 border-t border-slate-100 p-4 dark:border-slate-800"
              >
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={t('Write a message…')}
                  className="h-12 min-w-0 flex-1 rounded-xl bg-slate-100 px-4 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={busy || !text.trim()}
                  aria-label={t('Send message')}
                  className="grid size-12 place-items-center rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center text-slate-400">
              <div>
                <MessageCircle size={32} className="mx-auto" />
                <b className="mt-3 block text-sm text-slate-700 dark:text-slate-200">
                  {t('Select a conversation')}
                </b>
                <span className="mt-1 block text-xs">{t('Your messages will appear here.')}</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
