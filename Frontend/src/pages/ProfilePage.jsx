import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Check, LogOut, Save } from 'lucide-react';
import { useMarketplaceData } from '../app/MarketplaceDataContext';
import { updateProfile } from '../features/auth/authApi';
import Avatar from '../components/Avatar';
import { uploadFiles } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';
import { useToast } from '../app/ToastContext';

const fieldClass =
  'mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

// صفحهٔ ویرایش اطلاعات حساب و تصویر پروفایل فروشنده.
export default function ProfilePage() {
  const { t } = useTranslation();
  const { provinces } = useMarketplaceData();
  const { user, setUser, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    if (!photo) {
      setPhotoPreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form);

    try {
      if (photo) {
        data.avatarUrl = (await uploadFiles('/uploads/avatar', [photo])).user.avatar_url;
      }
      const { user: updatedUser } = await updateProfile(data);
      setUser(updatedUser);
      localStorage.setItem('motrly_user', JSON.stringify(updatedUser));
      toast(t('Your profile has been saved.'));
    } catch (error) {
      toast(t(error.message));
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    signOut();
    navigate('/login');
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <Avatar
            src={photoPreview || user.avatar_url}
            name={user.name}
            className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-amber-100 text-xl font-black text-amber-900 dark:bg-amber-300/15 dark:text-amber-200"
          />
          <span>
            <div className="text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-300">
              {t('MOTRLY ACCOUNT')}
            </div>
            <h1 className="mt-1 text-2xl font-black dark:text-white">{t('Edit your profile')}</h1>
            <p className="mt-1 text-xs text-slate-500">
              @{user.username} · {user.email}
            </p>
          </span>
        </div>

        <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
          <Field label={t('Full name')}>
            <input name="name" defaultValue={user.name} required className={fieldClass} />
          </Field>
          <Field label={t('Seller account')}>
            <select
              name="sellerType"
              defaultValue={user.seller_type || 'private'}
              className={fieldClass}
            >
              <option value="private">{t('Private seller')}</option>
              <option value="company">{t('Company / dealer')}</option>
            </select>
          </Field>
          <Field label={t('Company name')}>
            <input
              name="companyName"
              defaultValue={user.company_name || ''}
              className={fieldClass}
            />
          </Field>
          <Field label={t('Phone number')}>
            <input name="phone" defaultValue={user.phone || ''} className={fieldClass} />
          </Field>
          <Field label={t('Province')}>
            <select name="province" defaultValue={user.province || ''} className={fieldClass}>
              <option value="">{t('Choose province')}</option>
              {provinces
                .filter(({ is_all }) => !is_all)
                .map(({ name }) => (
                  <option key={name} value={name}>
                    {t(name)}
                  </option>
                ))}
            </select>
          </Field>
          <Field label={t('City')}>
            <input name="city" defaultValue={user.city || ''} className={fieldClass} />
          </Field>
          <Field label={t('About you')} wide>
            <textarea
              name="about"
              defaultValue={user.about || ''}
              rows="4"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm sm:col-span-2 dark:border-slate-700">
            <Camera size={18} className="text-amber-600" />
            <span className="flex-1 text-xs font-bold">
              {photo?.name || t('Change profile photo')}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => setPhoto(event.target.files?.[0] || null)}
            />
          </label>
          <button
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-60 sm:col-span-2"
          >
            <Save size={16} />
            {busy ? t('Saving…') : t('Save profile')}
            <Check size={15} />
          </button>
        </form>

        <button
          onClick={logout}
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-300/10"
        >
          <LogOut size={16} />
          {t('Sign out')}
        </button>
      </section>
    </main>
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
