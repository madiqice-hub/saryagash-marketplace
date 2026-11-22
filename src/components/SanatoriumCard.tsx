import React from 'react';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';

export interface Sanatorium {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  rating: number;
  min_price: number;
  profile: string[];
  main_image: string;
}

export default function SanatoriumCard({ item }: { item: Sanatorium }) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img
          src={item.main_image || 'https://unsplash.com'}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-lg flex items-center gap-1 text-sm font-bold text-slate-900 shadow">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          {item.rating}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="truncate">{item.address}</span>
        </div>

        <Link
          href={`/sanatorium/${item.slug}`}
          className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition mb-2"
        >
          {item.name}
        </Link>

        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
          {item.description}
        </p>

        {item.profile && item.profile.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {item.profile.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Цена от</span>
            <span className="text-lg font-extrabold text-slate-900">
              {item.min_price.toLocaleString('ru-RU')} ₸
            </span>
            <span className="text-xs text-slate-500"> / сут</span>
          </div>

          <Link
            href={`/sanatorium/${item.slug}`}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-600 text-white text-sm font-medium transition"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  );
}
