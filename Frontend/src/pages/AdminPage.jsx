import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../lib/api';
import { useOutletContext } from 'react-router-dom';
import { Activity, CarFront, MessageCircle, ShieldCheck, Users } from 'lucide-react';

const tabs = ['Overview', 'Listings', 'Users', 'Reports', 'Messages', 'Activity'];
export default function AdminPage() {
  const { t } = useTranslation();
  const { toast } = useOutletContext();
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState({
    stats: {},
    listings: [],
    users: [],
    reports: [],
    messages: [],
    logs: [],
  });
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      const [stats, listings, users, reports, messages, logs] = await Promise.all(
        ['stats', 'listings', 'users', 'reports', 'messages', 'audit-logs'].map((path) =>
          apiRequest(`/admin/${path}`),
        ),
      );
      setData({
        stats: stats.stats,
        listings: listings.listings,
        users: users.users,
        reports: reports.reports,
        messages: messages.messages,
        logs: logs.logs,
      });
    } catch (error) {
      toast(t(error.message));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function action(path, options, success) {
    try {
      await apiRequest(path, options);
      toast(t(success));
      await load();
    } catch (error) {
      toast(t(error.message));
    }
  }
  async function moderate(item, status) {
    await action(
      `/admin/listings/${item.id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status, reason: 'Updated by administrator' }) },
      status === 'active' ? 'Listing approved' : 'Listing rejected',
    );
  }
  async function deleteListing(item) {
    if (window.confirm(t('Delete listing permanently?')))
      await action(
        `/admin/listings/${item.id}`,
        { method: 'DELETE', body: JSON.stringify({ reason: 'Removed by administrator' }) },
        'Listing deleted',
      );
  }
  async function block(person) {
    const blocked = !person.blocked;
    const reason = blocked ? window.prompt(t('Enter a reason for blocking this account:')) : '';
    if (blocked && reason === null) return;
    await action(
      `/admin/users/${person.id}/block`,
      {
        method: 'PATCH',
        body: JSON.stringify({ blocked, reason: reason || 'Administrator action' }),
      },
      blocked ? 'Account blocked' : 'Account unblocked',
    );
  }
  async function warn(person) {
    const body = window.prompt(t('Write a warning message for {{name}}:', { name: person.name }));
    if (body?.trim())
      await action(
        `/admin/users/${person.id}/warn`,
        { method: 'POST', body: JSON.stringify({ body }) },
        'Warning sent',
      );
  }
  async function deleteUser(person) {
    if (
      window.confirm(
        t('Delete {{name}} and all associated listings and messages?', { name: person.name }),
      )
    )
      await action(
        `/admin/users/${person.id}`,
        { method: 'DELETE', body: JSON.stringify({ reason: 'Removed by administrator' }) },
        'Account deleted',
      );
  }
  async function deleteMessage(item) {
    if (window.confirm(t('Delete this message?')))
      await action(`/admin/messages/${item.id}`, { method: 'DELETE' }, 'Message deleted');
  }
  async function updateReport(item, status) {
    await action(
      `/admin/reports/${item.id}`,
      { method: 'PATCH', body: JSON.stringify({ status, adminNote: 'Reviewed by administrator' }) },
      'Report updated',
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">
            {t('MOTRLY CONTROL CENTER')}
          </div>
          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {t('Marketplace overview')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('Review listings, manage accounts and keep the marketplace healthy.')}
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-white dark:border-slate-700 dark:hover:bg-slate-900"
        >
          ↻ {t('Refresh')}
        </button>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          ['Members', data.stats.members, Users],
          ['Listings', data.stats.listings, CarFront],
          ['Pending review', data.stats.pending_listings, Activity],
          ['Open reports', data.stats.open_reports, ShieldCheck],
          ['Messages', data.stats.messages, MessageCircle],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-300">
              <Icon size={17} />
            </span>
            <small className="mt-3 block text-xs font-semibold text-slate-500">{t(label)}</small>
            <b className="mt-1 block text-2xl font-black dark:text-white">{value ?? '—'}</b>
          </div>
        ))}
      </div>
      <div className="mt-7 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold ${tab === item ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}
          >
            {t(item)}
          </button>
        ))}
      </div>
      {loading && <p className="mt-6 text-sm text-slate-500">{t('Refreshing dashboard…')}</p>}
      <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {tab === 'Overview' && (
          <div className="grid gap-8 p-5 md:grid-cols-2 sm:p-7">
            <div>
              <h2 className="font-extrabold dark:text-white">{t('Needs your review')}</h2>
              {data.listings
                .filter((item) => item.status === 'pending')
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border-b border-slate-100 py-4 dark:border-slate-800"
                  >
                    <CarFront className="shrink-0 text-amber-600" />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm dark:text-white">{item.title}</b>
                      <small className="text-xs text-slate-500">
                        {item.seller_name} · {t(item.province)}
                      </small>
                    </span>
                    <button
                      onClick={() => moderate(item, 'active')}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 dark:bg-slate-300/10 dark:text-slate-300"
                    >
                      {t('Approve')}
                    </button>
                  </div>
                ))}
            </div>
            <div>
              <h2 className="font-extrabold dark:text-white">{t('Recent reports')}</h2>
              {data.reports
                .filter((item) => item.status === 'open')
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-slate-100 py-4 dark:border-slate-800"
                  >
                    <b className="block text-sm dark:text-white">
                      {item.listing_title || t('Reported account')}
                    </b>
                    <small className="text-xs text-slate-500">{item.reason}</small>
                  </div>
                ))}
            </div>
          </div>
        )}
        {tab === 'Listings' && (
          <DataHeading title={t('All listings')} count={data.listings.length}>
            {data.listings.map((item) => (
              <Row
                key={item.id}
                title={item.title}
                subtitle={`${item.seller_name} · ${t(item.province)} · ${t(item.status)}`}
              >
                <div className="flex flex-wrap gap-2">
                  {['pending', 'blocked', 'rejected'].includes(item.status) && (
                    <MiniButton onClick={() => moderate(item, 'active')} good>
                      {t(item.status === 'pending' ? 'Approve' : 'Reactivate')}
                    </MiniButton>
                  )}
                  <MiniButton onClick={() => deleteListing(item)}>{t('Delete')}</MiniButton>
                </div>
              </Row>
            ))}
          </DataHeading>
        )}
        {tab === 'Users' && (
          <DataHeading title={t('Member accounts')} count={data.users.length}>
            {data.users.map((item) => (
              <Row
                key={item.id}
                title={`${item.name} @${item.username || ''}`}
                subtitle={`${item.email} · ${t(item.province || 'Location not set')}`}
              >
                <div className="flex flex-wrap gap-2">
                  <MiniButton onClick={() => warn(item)}>{t('Warn')}</MiniButton>
                  <MiniButton onClick={() => block(item)}>
                    {t(item.blocked ? 'Unblock' : 'Block account')}
                  </MiniButton>
                  <MiniButton onClick={() => deleteUser(item)}>{t('Delete account')}</MiniButton>
                </div>
              </Row>
            ))}
          </DataHeading>
        )}
        {tab === 'Reports' && (
          <DataHeading title={t('Safety reports')} count={data.reports.length}>
            {data.reports.map((item) => (
              <Row
                key={item.id}
                title={`${item.listing_title || t('Reported account')} · ${t(item.status)}`}
                subtitle={`${item.reporter_name}: ${item.reason}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {(item.evidence_urls || []).map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt={t('Evidence photo')}
                        className="size-12 rounded-lg object-cover"
                      />
                    </a>
                  ))}
                  <select
                    value={item.status}
                    onChange={(event) => updateReport(item, event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="open">{t('Open')}</option>
                    <option value="reviewing">{t('Reviewing')}</option>
                    <option value="resolved">{t('Resolved')}</option>
                    <option value="dismissed">{t('Dismissed')}</option>
                  </select>
                </div>
              </Row>
            ))}
          </DataHeading>
        )}
        {tab === 'Messages' && (
          <DataHeading title={t('Marketplace messages')} count={data.messages.length}>
            {data.messages.map((item) => (
              <Row
                key={item.id}
                title={`${item.sender_name} → ${item.recipient_name}`}
                subtitle={item.body}
              >
                <MiniButton onClick={() => deleteMessage(item)}>{t('Delete')}</MiniButton>
              </Row>
            ))}
          </DataHeading>
        )}
        {tab === 'Activity' && (
          <DataHeading title={t('Administrator activity')} count={data.logs.length}>
            {data.logs.map((item) => (
              <Row
                key={item.id}
                title={t(item.action.replaceAll('_', ' '))}
                subtitle={`${item.admin_name || t('Owner')} · ${t(item.target_type)} · ${item.target_id || '—'} · ${item.reason || ''}`}
              />
            ))}
          </DataHeading>
        )}
      </section>
    </main>
  );
}

function DataHeading({ title, count, children }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="font-extrabold dark:text-white">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800">
          {count}
        </span>
      </div>
      <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">{children}</div>
    </>
  );
}
function Row({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <span className="min-w-0 flex-1">
        <b className="block break-words text-sm text-slate-900 dark:text-white">{title}</b>
        <small className="mt-1 block break-words text-xs text-slate-500">{subtitle}</small>
      </span>
      {children}
    </div>
  );
}
function MiniButton({ onClick, children, good = false }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-bold ${good ? 'bg-slate-100 text-slate-800 dark:bg-slate-300/10 dark:text-slate-300' : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-amber-300/10 dark:hover:text-amber-300'}`}
    >
      {children}
    </button>
  );
}
