'use client';
export const dynamic = "force-dynamic";
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  Droplets,
  Loader2,
  MapPin,
  Star,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РўРёРїС‹ (РЅР°Р·РІР°РЅРёСЏ РєРѕР»РѕРЅРѕРє РєР°Рє РІ РІР°С€РµР№ Р‘Р”) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

type Category = 'Р­РєРѕРЅРѕРј' | 'РЎС‚Р°РЅРґР°СЂС‚' | 'Р›СЋРєСЃ';

interface Sanatorium {
  id: string | number;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  rating: number | null;
  min_price: number | null;
  profile: string[] | null;
  main_image: string | null;
}

interface Room {
  id: string | number;
  sanatorium_id: string | number;
  category: Category;
  title: string;
  description: string | null;
  price_per_day: number;
  capacity: number;
}

interface Doctor {
  id: string | number;
  sanatorium_id: string | number;
  full_name: string;
  specialty: string;
  experience_years: number | null;
}

interface Program {
  id: string | number;
  sanatorium_id: string | number;
  name: string;
  description: string | null;
  is_included: boolean;
  extra_price: number | null;
}

type TabKey = 'rooms' | 'doctors' | 'programs';

const TABS: { key: TabKey; label: string; icon: typeof BedDouble }[] = [
  { key: 'rooms', label: 'РќРѕРјРµСЂР° Рё С†РµРЅС‹', icon: BedDouble },
  { key: 'doctors', label: 'РќР°С€Рё РІСЂР°С‡Рё', icon: Stethoscope },
  { key: 'programs', label: 'Р›РµС‡РµР±РЅС‹Рµ РїСЂРѕРіСЂР°РјРјС‹', icon: Droplets },
];

const CATEGORIES: Category[] = ['Р­РєРѕРЅРѕРј', 'РЎС‚Р°РЅРґР°СЂС‚', 'Р›СЋРєСЃ'];

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РЈС‚РёР»РёС‚С‹ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

const formatPrice = (n: number | null | undefined) =>
  `${new Intl.NumberFormat('ru-RU').format(Math.round(n ?? 0))} в‚ё`;

const toISODate = (d: Date) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const countNights = (from: string, to: string) =>
  Math.round(
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000,
  );

const pluralDays = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'СЃСѓС‚РєРё';
  return 'СЃСѓС‚.';
};

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РњРµР»РєРёРµ РєРѕРјРїРѕРЅРµРЅС‚С‹ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function ImagePlaceholder({ className = '', label }: { className?: string; label?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-200 text-white/90 ${className}`}
      aria-hidden="true"
    >
      <Droplets className="h-12 w-12 drop-shadow" />
      {label && <span className="px-4 text-center text-sm font-semibold drop-shadow">{label}</span>}
    </div>
  );
}

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Р РµР№С‚РёРЅРі ${value} РёР· 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-bold">{value.toFixed(1)}</span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
      <div className="mb-6 h-10 w-64 rounded-xl bg-stone-200" />
      <div className="h-72 rounded-3xl bg-stone-200 md:h-96" />
      <div className="mt-6 h-8 w-1/2 rounded bg-stone-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-stone-200" />
    </div>
  );
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РЎС‚СЂР°РЅРёС†Р° в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function SanatoriumContent() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [sanatorium, setSanatorium] = useState<Sanatorium | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [tab, setTab] = useState<TabKey>('rooms');
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<string | number | null>(null);

  /* Р—Р°РіСЂСѓР·РєР° РґР°РЅРЅС‹С… */
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: san, error: sanErr } = await supabase
        .from('sanatoriums')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;
      if (sanErr) {
        setError('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РґР°РЅРЅС‹Рµ. РџСЂРѕРІРµСЂСЊС‚Рµ СЃРѕРµРґРёРЅРµРЅРёРµ Рё РѕР±РЅРѕРІРёС‚Рµ СЃС‚СЂР°РЅРёС†Сѓ.');
        setLoading(false);
        return;
      }
      if (!san) {
        setSanatorium(null);
        setLoading(false);
        return;
      }

      const [r, d, p] = await Promise.all([
        supabase.from('rooms').select('*').eq('sanatorium_id', san.id).order('price_per_day'),
        supabase.from('doctors').select('*').eq('sanatorium_id', san.id).order('full_name'),
        supabase.from('programs').select('*').eq('sanatorium_id', san.id).order('name'),
      ]);

      if (cancelled) return;
      if (r.error || d.error || p.error) {
        setError('Р§Р°СЃС‚СЊ РґР°РЅРЅС‹С… РЅРµ Р·Р°РіСЂСѓР·РёР»Р°СЃСЊ. РћР±РЅРѕРІРёС‚Рµ СЃС‚СЂР°РЅРёС†Сѓ.');
      }
      setSanatorium(san as Sanatorium);
      setRooms((r.data ?? []) as Room[]);
      setDoctors((d.data ?? []) as Doctor[]);
      setPrograms((p.data ?? []) as Program[]);
      setImgFailed(false);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const roomsByCategory = useMemo(
    () =>
      CATEGORIES.map((c) => ({ category: c, items: rooms.filter((r) => r.category === c) })).filter(
        (g) => g.items.length > 0,
      ),
    [rooms],
  );

  /* РќР°Р¶Р°С‚РёРµ В«Р—Р°Р±СЂРѕРЅРёСЂРѕРІР°С‚СЊВ»: СЃРЅР°С‡Р°Р»Р° РїСЂРѕРІРµСЂСЏРµРј Р°РІС‚РѕСЂРёР·Р°С†РёСЋ */
  const handleBookClick = useCallback(
    async (room: Room) => {
      setCheckingAuth(room.id);
      const { data } = await supabase.auth.getUser();
      setCheckingAuth(null);
      if (!data.user) {
        router.push('/login');
        return;
      }
      setBookingRoom(room);
    },
    [router],
  );

  if (loading) return <PageSkeleton />;

  if (!sanatorium) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-emerald-950">РЎР°РЅР°С‚РѕСЂРёР№ РЅРµ РЅР°Р№РґРµРЅ</h1>
        <p className="mt-2 text-stone-600">
          {error ?? 'Р’РѕР·РјРѕР¶РЅРѕ, СЃСЃС‹Р»РєР° СѓСЃС‚Р°СЂРµР»Р°. Р’РµСЂРЅРёС‚РµСЃСЊ РІ РєР°С‚Р°Р»РѕРі Рё РІС‹Р±РµСЂРёС‚Рµ РґСЂСѓРіРѕР№ СЃР°РЅР°С‚РѕСЂРёР№.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" /> РќР°Р·Р°Рґ РєРѕ РІСЃРµРј СЃР°РЅР°С‚РѕСЂРёСЏРј
        </button>
      </div>
    );
  }

  const showImage = sanatorium.main_image && !imgFailed;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/40 text-emerald-950">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <button
          onClick={() => router.push('/')}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-emerald-700/30 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          РќР°Р·Р°Рґ РєРѕ РІСЃРµРј СЃР°РЅР°С‚РѕСЂРёСЏРј
        </button>

        {error && (
          <div className="mb-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900" role="alert">
            {error}
          </div>
        )}

        {/* Hero */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-emerald-900/10">
          <div className="relative h-64 sm:h-80 md:h-[26rem]">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sanatorium.main_image as string}
                alt={sanatorium.name}
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlaceholder className="h-full w-full" label="Р¤РѕС‚Рѕ СЃРєРѕСЂРѕ РїРѕСЏРІРёС‚СЃСЏ" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white md:p-8">
              {sanatorium.profile && sanatorium.profile.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {sanatorium.profile.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="font-serif text-3xl font-bold leading-tight drop-shadow md:text-5xl">
                {sanatorium.name}
              </h1>
            </div>
          </div>

          <div className="grid gap-6 p-5 md:grid-cols-[2fr_1fr] md:p-8">
            <p className="max-w-2xl whitespace-pre-line leading-relaxed text-stone-700">
              {sanatorium.description || 'РћРїРёСЃР°РЅРёРµ СЃР°РЅР°С‚РѕСЂРёСЏ СЃРєРѕСЂРѕ РїРѕСЏРІРёС‚СЃСЏ.'}
            </p>
            <div className="space-y-3 rounded-2xl bg-amber-50 p-5 text-sm">
              {sanatorium.rating != null && <RatingStars value={sanatorium.rating} />}
              {sanatorium.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{sanatorium.address}</span>
                </div>
              )}
              {sanatorium.min_price != null && (
                <div>
                  <div className="text-stone-500">РџСЂРѕР¶РёРІР°РЅРёРµ РѕС‚</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatPrice(sanatorium.min_price)}
                    <span className="text-sm font-normal text-stone-500"> / СЃСѓС‚РєРё</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Р’РєР»Р°РґРєРё */}
        <div
          role="tablist"
          className="mt-8 flex gap-1 overflow-x-auto border-b border-amber-200/80"
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-2 border-b-[3px] px-4 py-3 text-sm font-bold transition md:text-base ${
                tab === key
                  ? 'border-emerald-700 text-emerald-700'
                  : 'border-transparent text-stone-500 hover:text-emerald-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {/* РќРѕРјРµСЂР° */}
          {tab === 'rooms' &&
            (roomsByCategory.length === 0 ? (
              <EmptyState text="РќРѕРјРµСЂР° РґР»СЏ СЌС‚РѕРіРѕ СЃР°РЅР°С‚РѕСЂРёСЏ РїРѕРєР° РЅРµ РґРѕР±Р°РІР»РµРЅС‹." />
            ) : (
              <div className="space-y-10">
                {roomsByCategory.map(({ category, items }) => (
                  <div key={category}>
                    <h2 className="mb-4 font-serif text-2xl font-bold">{category}</h2>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((room) => (
                        <article
                          key={room.id}
                          className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-emerald-900/10"
                        >
                          <ImagePlaceholder className="h-36" />
                          <div className="flex flex-1 flex-col gap-2 p-5">
                            <h3 className="text-lg font-bold">{room.title}</h3>
                            <div className="flex items-center gap-1.5 text-sm text-stone-500">
                              <Users className="h-4 w-4" /> РґРѕ {room.capacity} РіРѕСЃС‚.
                            </div>
                            {room.description && (
                              <p className="text-sm text-stone-700">{room.description}</p>
                            )}
                            <div className="mt-auto pt-3">
                              <div className="text-2xl font-bold text-emerald-700">
                                {formatPrice(room.price_per_day)}
                                <span className="text-xs font-normal text-stone-500"> / СЃСѓС‚РєРё</span>
                              </div>
                              <button
                                onClick={() => handleBookClick(room)}
                                disabled={checkingAuth === room.id}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-70"
                              >
                                {checkingAuth === room.id && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Р—Р°Р±СЂРѕРЅРёСЂРѕРІР°С‚СЊ
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* Р’СЂР°С‡Рё */}
          {tab === 'doctors' &&
            (doctors.length === 0 ? (
              <EmptyState text="РЎРїРёСЃРѕРє РІСЂР°С‡РµР№ СЃРєРѕСЂРѕ РїРѕСЏРІРёС‚СЃСЏ." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {doctors.map((d) => (
                  <article
                    key={d.id}
                    className="rounded-2xl bg-white p-6 text-center shadow-lg shadow-emerald-900/10"
                  >
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-400 text-white">
                      <Stethoscope className="h-9 w-9" />
                    </div>
                    <h3 className="font-bold leading-snug">{d.full_name}</h3>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">{d.specialty}</p>
                    {d.experience_years != null && (
                      <p className="mt-1 text-sm text-stone-500">РЎС‚Р°Р¶ {d.experience_years} Р»РµС‚</p>
                    )}
                  </article>
                ))}
              </div>
            ))}

          {/* РџСЂРѕРіСЂР°РјРјС‹ */}
          {tab === 'programs' &&
            (programs.length === 0 ? (
              <EmptyState text="Р›РµС‡РµР±РЅС‹Рµ РїСЂРѕРіСЂР°РјРјС‹ СЃРєРѕСЂРѕ РїРѕСЏРІСЏС‚СЃСЏ." />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <ProgramList
                  title="Р’С…РѕРґРёС‚ РІ СЃС‚РѕРёРјРѕСЃС‚СЊ РїСѓС‚С‘РІРєРё"
                  items={programs.filter((p) => p.is_included)}
                  included
                />
                <ProgramList
                  title="Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РїР»Р°С‚РЅС‹Рµ РїСЂРѕС†РµРґСѓСЂС‹"
                  items={programs.filter((p) => !p.is_included)}
                />
              </div>
            ))}
        </div>
      </div>

      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          sanatorium={sanatorium}
          onClose={() => setBookingRoom(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-white/60 py-14 text-center text-stone-500">
      {text}
    </div>
  );
}

function ProgramList({
  title,
  items,
  included = false,
}: {
  title: string;
  items: Program[];
  included?: boolean;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg shadow-emerald-900/10">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">РџРѕРєР° РЅРёС‡РµРіРѕ РЅРµС‚.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="flex gap-3 border-b border-amber-100 pb-3 last:border-0">
              {included && <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />}
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                {p.description && <p className="text-sm text-stone-600">{p.description}</p>}
              </div>
              {!included && (
                <div className="whitespace-nowrap font-bold text-emerald-700">
                  {formatPrice(p.extra_price)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ РњРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёСЏ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function BookingModal({
  room,
  sanatorium,
  onClose,
}: {
  room: Room;
  sanatorium: Sanatorium;
  onClose: () => void;
}) {
  const router = useRouter();
  const today = toISODate(new Date());
  const [checkIn, setCheckIn] = useState(addDays(today, 1));
  const [checkOut, setCheckOut] = useState(addDays(today, 8));
  const [guests, setGuests] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const nights = countNights(checkIn, checkOut);
  const total = nights > 0 ? nights * room.price_per_day : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleCheckIn = (value: string) => {
    setCheckIn(value);
    if (value && checkOut <= value) setCheckOut(addDays(value, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!checkIn || !checkOut) return setError('Р’С‹Р±РµСЂРёС‚Рµ РґР°С‚С‹ Р·Р°РµР·РґР° Рё РІС‹РµР·РґР°.');
    if (checkIn < today) return setError('Р”Р°С‚Р° Р·Р°РµР·РґР° РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ РІ РїСЂРѕС€Р»РѕРј.');
    if (nights < 1) return setError('Р”Р°С‚Р° РІС‹РµР·РґР° РґРѕР»Р¶РЅР° Р±С‹С‚СЊ РїРѕР·Р¶Рµ РґР°С‚С‹ Р·Р°РµР·РґР°.');
    if (guests < 1 || guests > room.capacity)
      return setError(`Р’ СЌС‚РѕРј РЅРѕРјРµСЂРµ РјРѕР¶РЅРѕ СЂР°Р·РјРµСЃС‚РёС‚СЊ РѕС‚ 1 РґРѕ ${room.capacity} РіРѕСЃС‚РµР№.`);

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      router.push('/login');
      return;
    }

    const { error: insertErr } = await supabase.from('bookings').insert({
      user_id: auth.user.id,
      sanatorium_id: sanatorium.id,
      room_id: room.id,
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guests,
      total_price: total,
      status: 'pending',
    });
    setSaving(false);

    if (insertErr) {
      setError('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ Р±СЂРѕРЅСЊ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.');
      return;
    }
    setDone(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Р‘СЂРѕРЅРёСЂРѕРІР°РЅРёРµ РЅРѕРјРµСЂР°"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <button
          onClick={onClose}
          aria-label="Р—Р°РєСЂС‹С‚СЊ"
          className="absolute right-4 top-4 rounded-full p-1 text-stone-500 hover:bg-stone-100"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
            <h2 className="mt-4 font-serif text-2xl font-bold">Р‘СЂРѕРЅСЊ РѕС„РѕСЂРјР»РµРЅР°</h2>
            <p className="mt-2 text-stone-600">
              {sanatorium.name}, {room.title}
              <br />
              {checkIn} вЂ” {checkOut}, {formatPrice(total)}
            </p>
            <p className="mt-1 text-sm text-stone-500">РЎС‚Р°С‚СѓСЃ: РѕР¶РёРґР°РµС‚ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-emerald-700 py-3 font-bold text-white hover:bg-emerald-800"
            >
              Р“РѕС‚РѕРІРѕ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="pr-8 font-serif text-2xl font-bold">Р‘СЂРѕРЅРёСЂРѕРІР°РЅРёРµ</h2>
              <p className="mt-1 text-sm text-stone-600">
                {sanatorium.name} В· {room.category}, {room.title}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold">
                <span className="mb-1 flex items-center gap-1">
                  <CalendarDays className="h-4 w-4 text-emerald-700" /> Р—Р°РµР·Рґ
                </span>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => handleCheckIn(e.target.value)}
                  className="w-full rounded-xl border border-amber-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  required
                />
              </label>
              <label className="text-sm font-semibold">
                <span className="mb-1 flex items-center gap-1">
                  <CalendarDays className="h-4 w-4 text-emerald-700" /> Р’С‹РµР·Рґ
                </span>
                <input
                  type="date"
                  min={checkIn ? addDays(checkIn, 1) : today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-xl border border-amber-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  required
                />
              </label>
            </div>

            <label className="block text-sm font-semibold">
              <span className="mb-1 flex items-center gap-1">
                <Users className="h-4 w-4 text-emerald-700" /> РљРѕР»РёС‡РµСЃС‚РІРѕ РіРѕСЃС‚РµР№
              </span>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-xl border border-amber-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {Array.from({ length: Math.max(1, room.capacity) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl bg-amber-50 p-4 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>
                  {formatPrice(room.price_per_day)} Г— {Math.max(nights, 0)} {pluralDays(nights)}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-semibold">РС‚РѕРіРѕ</span>
                <span className="text-2xl font-bold text-emerald-700">{formatPrice(total)}</span>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-70"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              РџРѕРґС‚РІРµСЂРґРёС‚СЊ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
export default function SanatoriumPage(){ return <Suspense fallback={<div>Загрузка...</div>}><SanatoriumContent /></Suspense>; }