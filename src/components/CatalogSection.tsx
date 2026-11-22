'use client';

import React, { useState } from 'react';
import SanatoriumCard, { Sanatorium } from './SanatoriumCard';
import { Search } from 'lucide-react';

export default function CatalogSection({ initialData }: { initialData: Sanatorium[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('Все');
  const [maxPrice, setMaxPrice] = useState<number>(150000);

  const profiles = ['Все', 'ЖКТ', 'Опорно-двигательный аппарат', 'Нервная система', 'Детокс'];

  const filtered = initialData.filter((item) => {
    const byName = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const byProf = selectedProfile === 'Все' || item.profile?.includes(selectedProfile);
    const byPrice = item.min_price <= maxPrice;
    return byName && byProf && byPrice;
  });

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl p-5 shadow-xl text-slate-900 grid grid-cols-1 md:grid-cols-12 gap-4 items-end border border-slate-100">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Название санатория</label>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Aray Deluxe, Алтын Булак..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Профиль лечения</label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              {profiles.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Цена до: {maxPrice.toLocaleString('ru-RU')} ₸
            </label>
            <input
              type="range"
              min={15000}
              max={150000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Каталог санаториев ({filtered.length})</h2>
        {filtered.length === 0 ? (
          <p className="text-slate-500">Санатории не найдены.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => <SanatoriumCard key={item.id} item={item} />)}
          </div>
        )}
      </main>
    </>
  );
}
