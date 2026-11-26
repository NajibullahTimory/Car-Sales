import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';
import { apiRequest } from '../lib/api';

const MarketplaceDataContext = createContext({ categories: [], provinces: [] });

// داده‌های پایهٔ بازار را یک‌بار از API می‌گیرد و میان صفحه‌ها به اشتراک می‌گذارد.
export function MarketplaceDataProvider({ children }) {
  const toast = useToast();
  const [data, setData] = useState({ categories: [], provinces: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiRequest('/metadata')
      .then((metadata) => {
        if (mounted)
          setData({ categories: metadata.categories || [], provinces: metadata.provinces || [] });
      })
      .catch((error) => {
        if (mounted) toast(error.message);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [toast]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">Motrly</main>
    );
  }
  return <MarketplaceDataContext.Provider value={data}>{children}</MarketplaceDataContext.Provider>;
}

// دسته‌ها و ولایت‌های بارگذاری‌شده از دیتابیس را برمی‌گرداند.
export function useMarketplaceData() {
  return useContext(MarketplaceDataContext);
}
