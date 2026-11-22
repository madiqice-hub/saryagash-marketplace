import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import CatalogSection from '@/components/CatalogSection';
import { User, Sparkles } from 'lucide-react';

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
            <span>Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚</span>
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white pt-14 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-700/60 text-teal-100 text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Р•РґРёРЅС‹Р№ РјР°СЂРєРµС‚РїР»РµР№СЃ РєСѓСЂРѕСЂС‚Р° РЎР°СЂС‹Р°РіР°С€
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Р’СЃРµ СЃР°РЅР°С‚РѕСЂРёРё РЎР°СЂС‹Р°РіР°С€Р° РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            РЎСЂР°РІРЅРёРІР°Р№С‚Рµ С†РµРЅС‹ РЅР° РЅРѕРјРµСЂР° Р­РєРѕРЅРѕРј, РЎС‚Р°РЅРґР°СЂС‚ Рё Р›СЋРєСЃ, РІСЂР°С‡РµР№ Рё Р»РµС‡РµР±РЅС‹Рµ РїСЂРѕРіСЂР°РјРјС‹.
          </p>
        </div>
      </section>

      {error ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            РћС€РёР±РєР° РїРѕРґРєР»СЋС‡РµРЅРёСЏ Рє Р±Р°Р·Рµ: {error.message}
          </div>
        </div>
      ) : (
        <CatalogSection initialData={sanatoriums || []} />
      )}
    </div>
  );
}
