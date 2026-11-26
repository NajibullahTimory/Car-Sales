// کارت ها
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Flag, MapPin, MessageCircle, Phone, Plus, X } from 'lucide-react';
import { apiRequest, uploadFiles } from '../lib/api';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../features/auth/AuthContext';
import Avatar from './Avatar';

export default function ListingDetailsDialog({ item, onClose, onMessage }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();
  const photos = item.images || [];
  const sellerPhone = item.seller_contact_phone || item.seller?.phone;
  const [index, setIndex] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportImages, setReportImages] = useState([]);
  const reportFileInput = useRef(null);
  const image = photos[index]?.url;
  const facts = [
    [t('Year'), item.year || '—'],
    [
      t('Mileage'),
      item.mileage ? `${new Intl.NumberFormat().format(item.mileage)} km` : t('Not listed'),
    ],
    [t('Fuel'), t(item.fuel || 'Not listed')],
    [t('Transmission'), t(item.transmission || 'Not listed')],
    [t('Condition'), t(item.condition || 'Used')],
    [t('Location'), `${t(item.province)}${item.city ? `, ${item.city}` : ''}`],
  ];

  // فرم گزارش را برای آگهی واقعی و متعلق به کاربر دیگر باز می‌کند.
  function openReportForm() {
    if (String(item.id).startsWith('demo-')) {
      toast(t('Reports are available for live listings only.'));
      return;
    }
    if (item.seller_id === user?.id) {
      toast(t('You cannot report your own listing.'));
      return;
    }
    setReportOpen(true);
  }

  // هر بار انتخاب فایل، عکس‌ها را به فهرست قبلی اضافه می‌کند.
  function addReportImages(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    const allowed = selected.filter(
      (file) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
        file.size <= 5 * 1024 * 1024,
    );
    if (allowed.length !== selected.length)
      toast(t('Choose JPG, PNG or WebP images, each 5 MB or smaller.'));
    const remaining = 12 - reportImages.length;
    if (allowed.length > remaining) toast(t('You can attach up to 12 photos.'));
    setReportImages((current) => [...current, ...allowed.slice(0, remaining)]);
  }

  // گزارش و حداکثر ۱۲ عکس مدرک را می‌فرستد.
  async function submitReport(event) {
    event.preventDefault();
    if (reportReason.trim().length < 5) {
      toast(t('Please explain the report in at least 5 characters.'));
      return;
    }
    if (
      reportImages.length > 12 ||
      reportImages.some(
        (file) =>
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
          file.size > 5 * 1024 * 1024,
      )
    ) {
      toast(t('Choose up to 12 JPG, PNG or WebP images, each 5 MB or smaller.'));
      return;
    }
    setReporting(true);
    try {
      const uploaded = reportImages.length
        ? await uploadFiles('/uploads/images', reportImages)
        : { urls: [] };
      await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          listingId: item.id,
          reason: reportReason.trim(),
          evidenceUrls: uploaded.urls,
        }),
      });
      toast(t('Thanks. Your report was sent to the Motrly team.'));
      setReportOpen(false);
      setReportReason('');
      setReportImages([]);
    } catch (error) {
      toast(t(error.message));
    } finally {
      setReporting(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="relative grid max-h-[94vh] w-full max-w-5xl overflow-auto rounded-3xl bg-white shadow-2xl md:grid-cols-[1.05fr_.95fr] dark:bg-slate-900">
        <button
          onClick={onClose}
          aria-label={t('Close')}
          className="absolute end-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-slate-800 shadow"
        >
          <X size={18} />
        </button>
        <div className="relative min-h-64 bg-slate-100 md:min-h-[590px] dark:bg-slate-800">
          {image ? (
            <img src={image} alt={item.title} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="grid size-full min-h-64 place-items-center text-slate-400">
              {t('No vehicle photo')}
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setIndex((index + photos.length - 1) % photos.length)}
                className="absolute start-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={() => setIndex((index + 1) % photos.length)}
                className="absolute end-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"
              >
                <ChevronRight />
              </button>
            </>
          )}
          <span className="absolute bottom-4 start-4 rounded-xl bg-slate-950/75 px-3 py-2 text-xs font-bold text-white">
            {photos.length
              ? `${index + 1} / ${photos.length} ${t('photos')}`
              : t('No vehicle photo')}
          </span>
        </div>
        <div className="p-5 sm:p-8">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
            {t(item.category)} · {t(item.province)}
          </div>
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950 dark:text-white">
            {item.title}
          </h2>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {item.price == null ? t('Price on request') : `${item.price} ${item.currency || 'USD'}`}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <small className="block text-[11px] font-semibold text-slate-400">{label}</small>
                <b className="mt-1 block truncate text-sm text-slate-800 dark:text-slate-100">
                  {value}
                </b>
              </div>
            ))}
          </div>
          <h3 className="mt-6 text-sm font-extrabold text-slate-900 dark:text-white">
            {t('About this vehicle')}
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
            {item.description || t('Contact the seller for more details about this vehicle.')}
          </p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
            <Avatar
              src={item.seller_avatar_url}
              name={item.seller_name}
              className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-amber-100 font-black text-amber-900 dark:bg-amber-300/15 dark:text-amber-200"
            />
            <span className="min-w-0 flex-1">
              <b className="block truncate text-sm text-slate-900 dark:text-white">
                {item.seller_name || t('Motrly seller')}
              </b>
              <small className="text-xs text-slate-500">
                {t(item.seller_type === 'company' ? 'Business seller' : 'Private seller')} ·{' '}
                <MapPin size={11} className="inline" /> {t(item.province)}
              </small>
            </span>
          </div>
          {sellerPhone && (
            <a
              href={`tel:${sellerPhone.replace(/[^\d+]/g, '')}`}
              className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-amber-300/10"
            >
              <Phone size={16} className="text-amber-600" />
              <span>{t('Phone number')}: {sellerPhone}</span>
            </a>
          )}
          <button
            onClick={onMessage}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
          >
            <MessageCircle size={17} />
            {t('Message seller')}
          </button>
          {/* گزینهٔ گزارش برای فرستادن آگهی مشکوک به صف بررسی مدیر */}
          <button
            type="button"
            onClick={openReportForm}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Flag size={15} />
            {t('Report this listing')}
          </button>
          {reportOpen && (
            <form
              onSubmit={submitReport}
              className="mt-3 space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"
            >
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                {t('Report reason')}
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder={t(
                    'Tell us why this listing should be reviewed (at least 5 characters):',
                  )}
                />
              </label>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t('Evidence photos')}
                </p>
                <input
                  ref={reportFileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={addReportImages}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={reportImages.length >= 12 || reporting}
                  onClick={() => reportFileInput.current?.click()}
                  className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <Plus size={16} />
                  {t('Add photos')}
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  {t('Up to 12 photos; JPG, PNG or WebP, maximum 5 MB each.')} {t('Selected')}:{' '}
                  {reportImages.length}/12
                </p>
                {reportImages.length > 0 && (
                  <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                    {reportImages.map((file, fileIndex) => (
                      <li
                        key={`${file.name}-${fileIndex}`}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs dark:bg-slate-900"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setReportImages((current) =>
                              current.filter((_, index) => index !== fileIndex),
                            )
                          }
                          className="shrink-0 font-bold text-rose-600"
                        >
                          {t('Remove')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportOpen(false);
                    setReportReason('');
                    setReportImages([]);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="flex-1 rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  {reporting ? t('Sending…') : t('Send report')}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
