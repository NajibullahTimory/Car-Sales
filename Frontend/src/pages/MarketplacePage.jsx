// First page of our website
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownUp,
  ArrowRight,
  ChevronDown,
  Filter,
  LayoutGrid,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useMarketplaceData } from '../app/MarketplaceDataContext';
import { searchListings, getFavorites, setFavorite, getListing } from '../features/listings/listingsApi';
import { useAuth } from '../features/auth/AuthContext';
import ListingCard from '../components/ListingCard';
import ListingDetailsDialog from '../components/ListingDetailsDialog';

function readSavedIds() {
  try {
    const savedIds = JSON.parse(localStorage.getItem('motrly_saved') || '[]');
    return Array.isArray(savedIds) ? savedIds : [];
  } catch {
    return [];
  }
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const { categories: storedCategories, provinces } = useMarketplaceData();
  const { user } = useAuth();
  const { openPost, toast } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState(readSavedIds);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [province, setProvince] = useState('All Afghanistan');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [sort, setSort] = useState('newest');
  const [advanced, setAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const categories = storedCategories.map(({ id, label }) => ({
    id,
    label,
    Icon: LayoutGrid,
  }));

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ limit: '50', sort });
    if (query.trim()) params.set('q', query.trim());
    if (category !== 'all') params.set('category', category);
    if (province !== 'All Afghanistan') params.set('province', province);
    if (minPrice) params.set('priceMin', minPrice);
    if (maxPrice) params.set('priceMax', maxPrice);
    if (yearMin) params.set('yearMin', yearMin);
    if (yearMax) params.set('yearMax', yearMax);

    setLoading(true);
    searchListings(params.toString())
      .then((data) => {
        if (!ignore && Array.isArray(data.listings)) setListings(data.listings);
      })
      .catch((error) => {
        if (!ignore) {
          setListings([]);
          toast(t(error.message));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query, category, province, minPrice, maxPrice, yearMin, yearMax, sort, location.key, t, toast]);

  useEffect(() => {
    let ignore = false;
    getFavorites()
      .then((data) => {
        if (ignore) return;
        const savedIds = (data.listings || []).map((item) => item.id);
        setFavorites(savedIds);
        localStorage.setItem('motrly_saved', JSON.stringify(savedIds));
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [user]);

  const visible = useMemo(() => listings.filter((item) => {
    const phrase = query.toLowerCase().trim();
    const searchableText = `${item.title || ''} ${item.make || ''} ${item.model || ''} ${item.province || ''} ${item.city || ''} ${item.description || ''} ${item.seller_name || ''}`.toLowerCase();
    return (!phrase || searchableText.includes(phrase))
      && (category === 'all' || item.category === category)
      && (province === 'All Afghanistan' || item.province === province)
      && (!minPrice || Number(item.price) >= Number(minPrice))
      && (!maxPrice || Number(item.price) <= Number(maxPrice))
      && (!yearMin || Number(item.year) >= Number(yearMin))
      && (!yearMax || Number(item.year) <= Number(yearMax));
  }), [listings, query, category, province, minPrice, maxPrice, yearMin, yearMax]);

  async function toggleFavorite(item) {
    const wasSaved = favorites.includes(item.id);
    const nextFavorites = wasSaved
      ? favorites.filter((id) => id !== item.id)
      : [...favorites, item.id];

    setFavorites(nextFavorites);
    localStorage.setItem('motrly_saved', JSON.stringify(nextFavorites));

    try {
      await setFavorite(item.id, !wasSaved);
      toast(t(wasSaved ? 'Removed from saved' : 'Saved to your collection'));
    } catch (error) {
      setFavorites(favorites);
      localStorage.setItem('motrly_saved', JSON.stringify(favorites));
      toast(t(error.message));
    }
  }

  async function openDetails(item) {
    setSelected(item);
    if (!String(item.id).startsWith('demo-')) {
      getListing(item.id).then((data) => setSelected(data.listing)).catch(() => {});
    }
  }

  function contactSeller() {
    if (!selected?.seller_id) {
      toast(t('Sign in to Motrly with a live listing to contact its seller.'));
      return;
    }
    navigate('/messages', { state: { target: selected } });
    setSelected(null);
  }

  function resetFilters() {
    setQuery('');
    setCategory('all');
    setProvince('All Afghanistan');
    setMinPrice('');
    setMaxPrice('');
    setYearMin('');
    setYearMax('');
  }

  const hasActiveFilters = query || category !== 'all' || province !== 'All Afghanistan'
    || minPrice || maxPrice || yearMin || yearMax;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12">
        <div className="absolute inset-y-0 end-0 -z-10 hidden w-2/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/25 via-slate-900/20 to-transparent lg:block" />
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-amber-300">
              <Sparkles size={14} />{t('MOTRLY VEHICLE MARKETPLACE')}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              {t('Millions of possibilities.')}<br />
              <span className="text-amber-300">{t('One simple search.')}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {t('Find cars, motorcycles, trucks and equipment from sellers across Afghanistan.')}
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-5 lg:block">
            <ShieldCheck className="text-amber-300" />
            <b className="mt-3 block text-sm">{t('Buy. Sell. Move forward.')}</b>
            <span className="mt-1 block max-w-52 text-xs leading-5 text-slate-400">
              {t('Local vehicles · Trusted sellers · Direct messages')}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-black/20 md:grid-cols-[1.5fr_1fr_.8fr_.8fr_auto] dark:bg-slate-900">
          <label className="flex h-12 items-center gap-3 rounded-xl px-3 text-slate-400 focus-within:bg-slate-50 dark:focus-within:bg-slate-800">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Make, model or keyword')}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </label>
          <label className="flex h-12 items-center gap-2 rounded-xl bg-slate-50 px-3 text-slate-500 dark:bg-slate-800">
            <MapPin size={16} />
            <select
              value={province}
              onChange={(event) => setProvince(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none dark:text-white"
            >
              {provinces.map(({ name }) => <option key={name} value={name}>{t(name)}</option>)}
            </select>
          </label>
          <input
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            type="number"
            min="0"
            placeholder={t('Min price')}
            className="h-12 rounded-xl bg-slate-50 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-400/40 dark:bg-slate-800 dark:text-white"
          />
          <input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            type="number"
            min="0"
            placeholder={t('Max price')}
            className="h-12 rounded-xl bg-slate-50 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-amber-400/40 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="button"
            onClick={() => document.getElementById('vehicle-results')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
          >
            <Search size={17} /><span className="hidden lg:inline">{t('Find vehicles')}</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-2 font-bold text-slate-300 hover:bg-white/10"
          >
            <SlidersHorizontal size={14} />{t('Additional search options')}
            <ChevronDown size={14} className={advanced ? 'rotate-180' : ''} />
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-amber-200 hover:bg-white/10"
            >
              <X size={13} />{t('Clear search')}
            </button>
          )}
        </div>

        {advanced && (
          <div className="mt-2 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
            <label className="text-xs font-bold text-slate-300">
              {t('Year from')}
              <input type="number" value={yearMin} onChange={(event) => setYearMin(event.target.value)} className="mt-1 h-10 w-full rounded-lg bg-slate-900 px-3 text-sm text-white outline-none" />
            </label>
            <label className="text-xs font-bold text-slate-300">
              {t('Year to')}
              <input type="number" value={yearMax} onChange={(event) => setYearMax(event.target.value)} className="mt-1 h-10 w-full rounded-lg bg-slate-900 px-3 text-sm text-white outline-none" />
            </label>
            <button type="button" onClick={resetFilters} className="self-end rounded-lg bg-white/10 px-3 py-2.5 text-xs font-bold text-white">
              {t('Reset search')}
            </button>
          </div>
        )}
      </section>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
        {categories.map(({ id, label, Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => setCategory(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${category === id ? 'border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-300' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'}`}
          >
            <Icon size={16} />{t(label)}
          </button>
        ))}
      </div>

      <section id="vehicle-results" className="mt-7">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end dark:border-slate-800">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">{t('THE MARKETPLACE')}</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {t('Explore vehicles')}
              <span className="ms-2 rounded-full bg-slate-100 px-2.5 py-1 align-middle text-xs font-bold text-slate-500 dark:bg-slate-800">{visible.length}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">{t('Handpicked listings from sellers across Afghanistan.')}</p>
          </div>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            <ArrowDownUp size={15} />
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent text-sm font-semibold outline-none dark:text-slate-200">
              <option value="newest">{t('Newest first')}</option>
              <option value="price_asc">{t('Price: low to high')}</option>
              <option value="price_desc">{t('Price: high to low')}</option>
              <option value="year_desc">{t('Newest model year')}</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">
            {loading ? t('Updating marketplace…') : `${t('Showing')} ${visible.length} ${t('vehicles')}`}
          </p>
          <button type="button" onClick={openPost} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3.5 py-2.5 text-xs font-extrabold text-slate-950 sm:hidden">
            <span>+</span>{t('Create a listing')}
          </button>
        </div>

        {visible.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                saved={favorites.includes(item.id)}
                onSave={() => toggleFavorite(item)}
                onOpen={() => openDetails(item)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
            <Filter size={28} className="mx-auto text-slate-400" />
            <h3 className="mt-4 text-xl font-extrabold dark:text-white">{t('No vehicles found')}</h3>
            <p className="mt-2 text-sm text-slate-500">{t('Try changing your search or removing a filter.')}</p>
            <button type="button" onClick={resetFilters} className="mt-5 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300">
              {t('Clear search')}
            </button>
          </div>
        )}
      </section>

      <section className="mt-10 flex flex-col gap-5 rounded-3xl bg-amber-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:bg-amber-300/10">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[.2em] text-amber-800 dark:text-amber-300">{t('SELL ON MOTRLY')}</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{t('Your next buyer is already looking.')}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('List your vehicle in minutes and connect with people nearby.')}</p>
        </div>
        <button type="button" onClick={openPost} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300">
          {t('Create a listing')}<ArrowRight size={17} />
        </button>
      </section>

      {selected && (
        <ListingDetailsDialog item={selected} onClose={() => setSelected(null)} onMessage={contactSeller} />
      )}
    </main>
  );
}
