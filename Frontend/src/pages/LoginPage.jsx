// Login page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Camera,
  Check,
  Eye,
  EyeOff,
  Globe2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useToast } from '../app/ToastContext';
import { useMarketplaceData } from '../app/MarketplaceDataContext';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { provinces } = useMarketplaceData();
  const { authenticate } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoName, setPhotoName] = useState('');

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form);
    if (mode === 'register' && data.password !== data.passwordConfirmation) {
      toast(t('Passwords do not match.'));
      return;
    }
    data.passwordConfirmation = mode === 'register' ? data.passwordConfirmation : '';
    data.avatarFile = data.avatarFile?.size ? data.avatarFile : null;
    setBusy(true);
    try {
      const user = await authenticate(data);
      toast(t('Welcome, {{name}}!', { name: user.name?.split(' ')[0] || '' }));
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (error) {
      toast(t(error.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.03fr_.97fr] dark:bg-slate-950">
      <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=85"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/65 to-slate-900/40" />
        <LinkBrand t={t} />
        <div className="relative z-10 max-w-xl pb-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur">
            <Sparkles size={14} />
            {t('AFGHANISTAN VEHICLE MARKETPLACE')}
          </div>
          <h1 className="text-5xl font-black leading-[1.06] tracking-tight xl:text-6xl">
            {t('Find the right ride.')}
            <br />
            <span className="text-amber-300">{t('Make it yours.')}</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            {t('Discover trusted vehicles and equipment from sellers across Afghanistan.')}
          </p>
          <div className="mt-9 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <Benefit t={t} text="Cars, trucks and equipment" />
            <Benefit t={t} text="Connect directly with sellers" />
            <Benefit t={t} text="Your marketplace, your way" />
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span>{t('Built for Afghanistan')}</span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={15} />
            {t('Your account information is stored securely.')}
          </span>
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-5 sm:px-10 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <LinkBrand t={t} dark />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <Globe2 size={15} />
            <select
              aria-label={t('Language')}
              value={i18n.resolvedLanguage || 'en'}
              onChange={(event) => i18n.changeLanguage(event.target.value)}
              className="bg-transparent outline-none"
            >
              <option value="en">English</option>
              <option value="fa">دری</option>
              <option value="ps">پښتو</option>
            </select>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-amber-700 dark:text-amber-300">
            {t(mode === 'login' ? 'WELCOME BACK' : 'JOIN THE MARKETPLACE')}
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            {t(mode === 'login' ? 'Sign in to Motrly' : 'Create your account')}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t(
              mode === 'login'
                ? 'Continue to discover vehicles and connect with sellers.'
                : 'One account gives you access to the whole marketplace.',
            )}
          </p>
          <div className="mt-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}
            >
              {t('Sign in')}
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${mode === 'register' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}
            >
              {t('Create account')}
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('Full name')}>
                    <input
                      name="name"
                      required
                      autoComplete="name"
                      placeholder={t('Your full name')}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t('Username')}>
                    <input
                      name="username"
                      required
                      minLength="3"
                      maxLength="40"
                      pattern="[A-Za-z0-9_.-]+"
                      autoComplete="username"
                      placeholder={t('Choose a unique username')}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label={t('Email address')}>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('Account type')}>
                    <select name="sellerType" className={inputClass}>
                      <option value="private">{t('Private seller')}</option>
                      <option value="company">{t('Company / dealer')}</option>
                    </select>
                  </Field>
                  <Field label={t('Phone number')}>
                    <input
                      name="phone"
                      autoComplete="tel"
                      placeholder="+93 ..."
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('Province')}>
                    <select name="province" required className={inputClass}>
                      <option value="">{t('Choose province')}</option>
                      {provinces.filter(({ is_all }) => !is_all).map(({ name }) => (
                        <option value={name} key={name}>
                          {t(name)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('City')}>
                    <input
                      name="city"
                      required
                      placeholder={t('City or district')}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('Company name')}>
                    <input name="companyName" placeholder={t('Optional')} className={inputClass} />
                  </Field>
                  <Field label={t('About you')}>
                    <input
                      name="about"
                      placeholder={t('A short introduction (optional)')}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-3.5 text-sm hover:border-amber-400 dark:border-slate-700">
                  <Camera size={18} className="text-amber-600" />
                  <span className="min-w-0 flex-1">
                    <b className="block text-slate-800 dark:text-slate-100">{t('Profile photo')}</b>
                    <small className="block truncate text-xs text-slate-500">
                      {photoName || t('Choose a JPG, PNG or WebP image')}
                    </small>
                  </span>
                  <input
                    name="avatarFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => setPhotoName(event.target.files?.[0]?.name || '')}
                  />
                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold dark:bg-slate-800">
                    {t('Browse')}
                  </span>
                </label>
              </>
            )}
            {mode === 'login' && (
              <Field label={t('Username or email')}>
                <input
                  name="identifier"
                  required
                  autoComplete="username"
                  placeholder={t('Enter your username or email')}
                  className={inputClass}
                />
              </Field>
            )}
            <Field label={t('Password')}>
              <span className="relative block">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength="8"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={t('At least 8 characters')}
                  className={`${inputClass} pe-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  className="absolute inset-y-0 end-3 text-slate-400"
                  aria-label={t('Show password')}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </Field>
            {mode === 'register' && (
              <Field label={t('Confirm password')}>
                <input
                  name="passwordConfirmation"
                  type="password"
                  required
                  minLength="8"
                  autoComplete="new-password"
                  placeholder={t('Type your password again')}
                  className={inputClass}
                />
              </Field>
            )}
            {mode === 'login' && (
              <div className="text-end">
                <button
                  type="button"
                  onClick={() =>
                    toast(t('Please contact the site administrator to reset a password.'))
                  }
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-300"
                >
                  {t('Forgot password?')}
                </button>
              </div>
            )}
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
            >
              {busy
                ? t('Please wait…')
                : mode === 'login'
                  ? t('Sign in and continue')
                  : t('Create account')}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <Check size={14} className="mt-0.5 shrink-0 text-slate-600" />
            {t('Your account information is stored securely.')}
          </p>
        </div>
        <div className="pb-4 text-center text-xs text-slate-400">© 2026 Motrly Marketplace</div>
      </section>
    </main>
  );
}

const inputClass =
  'mt-1.5 block h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600';
function Field({ label, children }) {
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
      {label}
      {children}
    </label>
  );
}
function Benefit({ t, text }) {
  return (
    <span className="flex items-center gap-2">
      <Check size={15} className="text-amber-300" />
      {t(text)}
    </span>
  );
}
function LinkBrand({ t, dark = false }) {
  return (
    <div
      className={`relative z-10 inline-flex w-fit items-center gap-3 text-xl font-black tracking-tight ${dark ? 'text-slate-950 dark:text-white' : 'text-white'}`}
    >
      <span className="grid size-10 place-items-center rounded-2xl bg-amber-400 text-slate-950">
        <img src="/motrly-mark.svg" alt="" className="size-6" />
      </span>
      <span>
        motrly<span className="text-amber-400">.</span>
        <small className="block text-[9px] font-bold uppercase tracking-[.2em] text-current opacity-55">
          {t('VEHICLE MARKETPLACE')}
        </small>
      </span>
    </div>
  );
}
