// لیست های من
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import {
  deleteListing,
  getFavorites,
  getMyListings,
  getListing,
  setFavorite,
} from '../features/listings/listingsApi';
import ListingCard from './ListingCard';
import ListingDetailsDialog from './ListingDetailsDialog';
import CreateListingModal from '../features/marketplace/CreateListingModal';
import { useToast } from '../app/ToastContext';

export default function ListingCollection({ type }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const title = type === 'saved' ? t('Your saved vehicles') : t('Your listings');

  useEffect(() => {
    let active = true;
    const loadListings = type === 'saved' ? getFavorites : getMyListings;

    loadListings()
      .then((data) => {
        if (active) setListings(data.listings || []);
      })
      .catch((error) => toast(t(error.message)));

    return () => {
      active = false;
    };
  }, [type, t, toast]);

  async function removeSaved(item) {
    const previousListings = listings;
    setListings((current) => current.filter((listing) => listing.id !== item.id));

    try {
      await setFavorite(item.id, false);
    } catch (error) {
      setListings(previousListings);
      toast(t(error.message));
    }
  }

  async function removeMine(item) {
    if (!window.confirm(t('Delete listing permanently?'))) return;

    try {
      await deleteListing(item.id);
      setListings((current) => current.filter((listing) => listing.id !== item.id));
      toast(t('Listing deleted'));
    } catch (error) {
      toast(t(error.message));
    }
  }

  async function openListing(item) {
    try {
      const data = await getListing(item.id);
      setSelected(data.listing);
    } catch {
      setSelected(item);
    }
  }

  return (
    <main className="mx-auto min-h-[65vh] max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
      <div className="text-[11px] font-extrabold uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">
        {type === 'saved' ? t('SAVED VEHICLES') : t('YOUR GARAGE')}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {listings.length} {t('vehicles')}
          </p>
        </div>
      </div>

      {listings.length ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              saved={type === 'saved'}
              onSave={() => removeSaved(item)}
              onEdit={type === 'mine' ? () => setEditing(item) : undefined}
              onDelete={type === 'mine' ? () => removeMine(item) : undefined}
              onOpen={() => openListing(item)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <Search className="mx-auto text-slate-400" />
          <h2 className="mt-4 text-lg font-extrabold dark:text-white">
            {t(type === 'saved' ? 'Nothing saved yet' : 'No listings yet')}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              type === 'saved'
                ? 'Tap the heart on any vehicle to save it here.'
                : 'Create a listing to show your vehicle to buyers.',
            )}
          </p>
        </div>
      )}

      {selected && (
        <ListingDetailsDialog
          item={selected}
          onClose={() => setSelected(null)}
          onMessage={() => toast(t('Open a vehicle listing to contact a seller.'))}
        />
      )}
      {editing && (
        <CreateListingModal
          listing={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setListings((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            );
            setEditing(null);
          }}
          toast={toast}
        />
      )}
    </main>
  );
}
