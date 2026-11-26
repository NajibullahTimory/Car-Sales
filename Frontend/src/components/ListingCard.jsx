//  کارت های آگاهی را نمایش میدهد 
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Pencil,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export default function ListingCard({ item, saved, onSave, onOpen, onEdit, onDelete }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const photo = item.images?.[0]?.url;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-start dark:bg-slate-800"
        aria-label={`${t('Details')}: ${item.title}`}
      >
        {photo && !failed ? (
          <img
            src={photo}
            alt={item.title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-slate-400">
            <span className="text-sm">{t('Photo unavailable')}</span>
          </div>
        )}
        <span className="absolute start-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 shadow-sm">
          {t(item.condition === 'new' ? 'New' : 'Used')}
        </span>
        <span className="absolute bottom-3 start-3 rounded-lg bg-slate-950/75 px-2.5 py-1 text-xs font-semibold text-white">
          {t(item.province)}
        </span>
      </button>

      <button
        type="button"
        onClick={onSave}
        aria-label={t(saved ? 'Remove saved listing' : 'Save listing')}
        aria-pressed={saved}
        className={`absolute end-3 top-3 z-10 grid size-10 place-items-center rounded-full shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50 ${saved ? 'bg-amber-500 text-white' : 'bg-white/95 text-slate-600 hover:text-amber-500'}`}
      >
        <Heart size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>

      <div className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>{t(item.seller_type === 'company' ? 'DEALER' : 'PRIVATE SELLER')}</span>
          {item.seller_type === 'company' && (
            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <ShieldCheck size={13} />
              {t('Verified seller')}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="line-clamp-2 min-h-12 text-start text-base font-extrabold leading-6 text-slate-900 hover:text-amber-700 dark:text-white dark:hover:text-amber-300"
        >
          {item.title}
        </button>

        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {item.year || '—'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Gauge size={14} />
            {item.mileage ? `${new Intl.NumberFormat().format(item.mileage)} km` : '—'}
          </span>
          {item.fuel && (
            <span className="inline-flex items-center gap-1.5">
              <Fuel size={14} />
              {t(item.fuel)}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin size={14} />
          {t(item.province)}
          {item.city ? `, ${item.city}` : ''}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <b className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
            {item.price == null ? t('Price on request') : `${item.price} ${item.currency || 'USD'}`}
          </b>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-amber-100 hover:text-amber-900 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-amber-300/15 dark:hover:text-amber-200"
          >
            {t('Details')}
          </button>
        </div>

        {(onEdit || onDelete) && (
          <div className="mt-3 flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Pencil size={14} />
                {t('Edit')}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
              >
                <Trash2 size={14} />
                {t('Delete')}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
