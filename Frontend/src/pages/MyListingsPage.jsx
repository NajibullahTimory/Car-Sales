import { useOutletContext } from 'react-router-dom';
import ListingCollection from '../components/ListingCollection';
export default function MyListingsPage() {
  const { openPost } = useOutletContext();
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-8 text-end sm:px-6 lg:px-8">
        <button
          onClick={openPost}
          className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-slate-950"
        >
          + Create listing
        </button>
      </div>
      <ListingCollection type="mine" />
    </div>
  );
}
