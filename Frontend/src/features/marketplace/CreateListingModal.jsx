import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Camera, Plus, X } from 'lucide-react';
import { createListing, updateListing } from '../listings/listingsApi';
import { uploadFiles } from '../../lib/api';
import { useMarketplaceData } from '../../app/MarketplaceDataContext';
import { useAuth } from '../auth/AuthContext';

// آگاهی ها
const inputClass =
  'mt-1 block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

// فرم مشترک برای ثبت آگهی تازه و ویرایش آگهی موجود
export default function CreateListingModal({ onClose, toast, listing = null, onSaved }) {
  const { t } = useTranslation();
  const { categories, provinces } = useMarketplaceData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [savedPhotos, setSavedPhotos] = useState(() =>
    (listing?.images || []).map((image) => image.url),
  );
  const photoInput = useRef(null);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    values.year = values.year ? Number(values.year) : null;
    values.price = values.price ? Number(values.price) : null;
    values.mileage = values.mileage ? Number(values.mileage) : null;

    try {
      const uploadedUrls = photos.length ? (await uploadFiles('/uploads/images', photos)).urls : [];
      const imageUrls = [...savedPhotos, ...uploadedUrls];
      const payload = { ...values, imageUrls };
      const result = listing
        ? await updateListing(listing.id, payload)
        : await createListing(payload);

      toast(t(listing ? 'Listing updated' : 'Your listing is now live.'));
      onClose();
      if (listing) onSaved?.(result.listing);
      else navigate('/', { state: { refresh: Date.now(), newListingId: result.listing.id } });
    } catch (error) {
      toast(t(error.message));
    } finally {
      setBusy(false);
    }
  }

  function choosePhotos(event) {
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    const valid = picked.filter(
      (file) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
        file.size <= 5 * 1024 * 1024,
    );
    if (valid.length !== picked.length)
      toast(t('Choose JPG, PNG or WebP images, each 5 MB or smaller.'));
    const remaining = 12 - savedPhotos.length - photos.length;
    if (valid.length > remaining) toast(t('You can attach up to 12 photos.'));
    setPhotos((current) => [...current, ...valid.slice(0, remaining)]);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="relative max-h-[94vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-8 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Close')}
          className="absolute end-4 top-4 grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300"
        >
          <X size={18} />
        </button>
        <div className="text-xs font-bold uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">
          {t('SELL ON MOTRLY')}
        </div>
        <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
          {t(listing ? 'Edit listing' : 'List your vehicle')}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t(
            listing
              ? 'Update the details of your listing.'
              : 'Add the key details. Your listing will appear immediately after you post it.',
          )}
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label={t('Listing title')} wide>
            <input
              name="title"
              defaultValue={listing?.title || ''}
              minLength="4"
              required
              placeholder={t('e.g. Toyota Corolla 2019 — excellent condition')}
              className={inputClass}
            />
          </Field>
          <Field label={t('Vehicle type')}>
            <select
              name="category"
              defaultValue={listing?.category || 'car'}
              className={inputClass}
            >
              {categories
                .filter(({ id }) => id !== 'all')
                .map(({ id, label }) => (
                  <option value={id} key={id}>
                    {t(label)}
                  </option>
                ))}
            </select>
          </Field>
          <Field label={t('Condition')}>
            <select
              name="condition"
              defaultValue={listing?.condition || 'used'}
              className={inputClass}
            >
              <option value="used">{t('Used')}</option>
              <option value="new">{t('New')}</option>
              <option value="damaged">{t('Damaged')}</option>
            </select>
          </Field>
          <Field label={t('Make')}>
            <input
              name="make"
              defaultValue={listing?.make || ''}
              placeholder={t('e.g. Toyota')}
              className={inputClass}
            />
          </Field>
          <Field label={t('Model')}>
            <input
              name="model"
              defaultValue={listing?.model || ''}
              placeholder={t('e.g. Corolla')}
              className={inputClass}
            />
          </Field>
          <Field label={t('Year')}>
            <input
              name="year"
              defaultValue={listing?.year || ''}
              type="number"
              min="1900"
              max="2100"
              className={inputClass}
            />
          </Field>
          <Field label={t('Price')}>
            <input
              name="price"
              defaultValue={listing?.price || ''}
              type="number"
              min="0"
              placeholder={t('Price')}
              className={inputClass}
            />
          </Field>
          <Field label={t('Currency')}>
            <select
              name="currency"
              defaultValue={listing?.currency || 'USD'}
              className={inputClass}
            >
              <option value="USD">{t('US Dollar (USD)')}</option>
              <option value="AFN">{t('Afghan Afghani (AFN)')}</option>
            </select>
          </Field>
          <Field label={t('Province')}>
            <select
              name="province"
              defaultValue={listing?.province || ''}
              required
              className={inputClass}
            >
              <option value="">{t('Choose province')}</option>
              {provinces
                .filter(({ is_all }) => !is_all)
                .map(({ name }) => (
                  <option value={name} key={name}>
                    {t(name)}
                  </option>
                ))}
            </select>
          </Field>
          <Field label={t('City')}>
            <input
              name="city"
              defaultValue={listing?.city || ''}
              placeholder={t('City or district')}
              className={inputClass}
            />
          </Field>
          <Field label={t('Phone number')}>
            <input
              name="sellerContactPhone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              defaultValue={listing?.seller_contact_phone || user?.phone || ''}
              placeholder="+93 ..."
              className={inputClass}
            />
          </Field>
          <Field label={t('Mileage (km)')}>
            <input
              name="mileage"
              defaultValue={listing?.mileage || ''}
              type="number"
              min="0"
              className={inputClass}
            />
          </Field>
          <Field label={t('Fuel')}>
            <select name="fuel" defaultValue={listing?.fuel || ''} className={inputClass}>
              <option value="">{t('Choose fuel')}</option>
              {['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'].map((fuel) => (
                <option key={fuel} value={fuel}>
                  {t(fuel)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Transmission')}>
            <select
              name="transmission"
              defaultValue={listing?.transmission || ''}
              className={inputClass}
            >
              <option value="">{t('Choose transmission')}</option>
              {['Automatic', 'Manual', 'Semi-automatic'].map((transmission) => (
                <option key={transmission} value={transmission}>
                  {t(transmission)}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm sm:col-span-2 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Camera size={20} className="shrink-0 text-amber-600" />
              <span className="min-w-0 flex-1">
                <b className="block text-slate-800 dark:text-slate-100">{t('Vehicle photos')}</b>
                <small className="block text-xs text-slate-500">
                  {t('Choose up to 12 JPG, PNG or WebP images (max 5 MB each)')}
                </small>
              </span>
              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={choosePhotos}
              />
              <button
                type="button"
                disabled={busy || savedPhotos.length + photos.length >= 12}
                onClick={() => photoInput.current?.click()}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 disabled:opacity-50 dark:bg-amber-300/15 dark:text-amber-200"
              >
                <Plus size={15} />
                {t('Add photos')}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t('Selected')}: {savedPhotos.length + photos.length}/12
            </p>
            {(savedPhotos.length > 0 || photos.length > 0) && (
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                {savedPhotos.map((url, photoIndex) => (
                  <li
                    key={url}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs dark:bg-slate-800"
                  >
                    <span className="truncate">{url.split('/').pop()}</span>
                    <button
                      type="button"
                      aria-label={t('Remove')}
                      onClick={() =>
                        setSavedPhotos((current) =>
                          current.filter((_, index) => index !== photoIndex),
                        )
                      }
                      className="shrink-0 rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
                {photos.map((file, photoIndex) => (
                  <li
                    key={`${file.name}-${photoIndex}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs dark:bg-slate-800"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label={t('Remove')}
                      onClick={() =>
                        setPhotos((current) => current.filter((_, index) => index !== photoIndex))
                      }
                      className="shrink-0 rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Field label={t('Description')} wide>
            <textarea
              name="description"
              defaultValue={listing?.description || ''}
              rows="4"
              placeholder={t('Describe condition, history and important details…')}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </Field>
          <button
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50 sm:col-span-2"
          >
            {busy ? t('Submitting…') : t(listing ? 'Save changes' : 'Publish listing')}
            <ArrowRight size={17} />
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <label
      className={`block text-xs font-bold text-slate-700 dark:text-slate-300 ${wide ? 'sm:col-span-2' : ''}`}
    >
      {label}
      {children}
    </label>
  );
}
