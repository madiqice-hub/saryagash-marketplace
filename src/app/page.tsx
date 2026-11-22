import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import CatalogSection from '@/components/CatalogSection';
import { User, Sparkles } from 'lucide-react';

export const instant = false;
export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: sanatoriums, error } = await supabase
    .from('sanatoriums')
    .select('*')
    .order('rating', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-xl">S</div>
            <span className="font-bold text-xl">Saryagash <span className="text-teal-600">Resort</span></span>
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition"
          >
            <User className="w-4 h-4" />
            <span>Личный кабинет</span>
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white pt-14 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-700/60 text-teal-100 text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Единый маркетплейс курорта Сарыагаш
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Все санатории Сарыагаша в одном месте</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            Сравнивайте цены на номера Эконом, Стандарт и Люкс, врачей и лечебные программы.
          </p>
        </div>
      </section>

      {error ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            Ошибка подключения к базе: {error.message}
          </div>
        </div>
      ) : (
        <CatalogSection initialData={sanatoriums || []} />
      )}
    </div>
  );
}
