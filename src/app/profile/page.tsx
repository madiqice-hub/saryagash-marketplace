'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Ticket,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ───────────── Типы ───────────── */

interface ProfileForm {
  full_name: string;
  phone: string;
  email: string;
}

interface SanatoriumRef {
  name: string;
  address: string | null;
  slug: string;
}

interface RoomRef {
  category: string;
  title: string;
}

interface BookingRow {
  id: string | number;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  created_at: string;
  sanatoriums: SanatoriumRef | SanatoriumRef[] | null;
  rooms: RoomRef | RoomRef[] | null;
}

/* ───────────── Утилиты ───────────── */

/** Supabase может вернуть связь как объект или как массив — приводим к объекту */
function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const formatPrice = (n: number) => `${new Intl.NumberFormat('ru-RU').format(Math.round(n || 0))} ₸`;

const formatDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const nightsBetween = (a: string, b: string) =>
  Math.round(
    (new Date(`${b.slice(0, 10)}T00:00:00`).getTime() -
      new Date(`${a.slice(0, 10)}T00:00:00`).getTime()) /
      86400000,
  );

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Ожидает подтверждения', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Подтверждена', cls: 'bg-emerald-100 text-emerald-800' },
  paid: { label: 'Оплачена', cls: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Завершена', cls: 'bg-stone-200 text-stone-700' },
  cancelled: { label: 'Отменена', cls: 'bg-red-100 text-red-700' },
};

const statusView = (s: string) =>
  STATUS[s?.toLowerCase()] ?? { label: s || 'В обработке', cls: 'bg-stone-100 text-stone-700' };

/* ───────────── Страница ───────────── */

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<ProfileForm>({ full_name: '', phone: '', email: '' });
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.replace('/login');
      return;
    }
    const u = data.user;
    setUser(u);

    const [profileRes, bookingsRes] = await Promise.all([
      supabase.from('profiles').select('full_name, phone, email').eq('id', u.id).maybeSingle(),
      supabase
        .from('bookings')
        .select(
          'id, check_in, check_out, guests_count, total_price, status, created_at, sanatoriums(name, address, slug), rooms(category, title)',
        )
        .eq('user_id', u.id)
        .order('created_at', { ascending: false }),
    ]);

    // Если профиля ещё нет — подставляем данные из аккаунта
    const p = profileRes.data;
    setForm({
      full_name: p?.full_name ?? (u.user_metadata?.full_name as string | undefined) ?? '',
      phone: p?.phone ?? u.phone ?? '',
      email: p?.email ?? u.email ?? '',
    });

    if (profileRes.error || bookingsRes.error) {
      setLoadError('Не удалось загрузить часть данных. Обновите страницу.');
    }
    setBookings((bookingsRes.data ?? []) as unknown as BookingRow[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveMsg(null);

    const email = form.email.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return setSaveMsg({ ok: false, text: 'Введите корректный email.' });
    }

    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email,
    });
    setSaving(false);

    setSaveMsg(
      error
        ? { ok: false, text: 'Не удалось сохранить данные. Попробуйте ещё раз.' }
        : { ok: true, text: 'Данные сохранены.' },
    );
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  const initial = (form.full_name || form.email || '?').trim().charAt(0).toUpperCase();
  const inputCls =
    'w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-400';

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/40 text-emerald-950">
      {/* Шапка страницы */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-700 to-teal-500 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 font-serif text-2xl font-bold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-2xl font-bold md:text-3xl">
              {form.full_name || 'Личный кабинет'}
            </h1>
            <p className="truncate text-sm text-white/80">{form.email || form.phone}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/25 disabled:opacity-70"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Выйти из аккаунта
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Назад ко всем санаториям
        </Link>

        {loadError && (
          <div className="mb-6 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900" role="alert">
            {loadError}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* Личные данные */}
          <section className="h-fit rounded-3xl bg-white p-6 shadow-xl shadow-emerald-900/10">
            <h2 className="font-serif text-xl font-bold">Личные данные</h2>
            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">
                ФИО
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-emerald-700" />
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    autoComplete="name"
                    placeholder="Айдана Серикова"
                    className={inputCls}
                  />
                </div>
              </label>
              <label className="block text-sm font-semibold">
                Телефон
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-emerald-700" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    autoComplete="tel"
                    placeholder="+7 7XX XXX XX XX"
                    className={inputCls}
                  />
                </div>
              </label>
              <label className="block text-sm font-semibold">
                Электронная почта
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-emerald-700" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                    placeholder="name@mail.kz"
                    className={inputCls}
                  />
                </div>
              </label>

              {saveMsg && (
                <p
                  role={saveMsg.ok ? 'status' : 'alert'}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    saveMsg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {saveMsg.ok && <CheckCircle2 className="h-4 w-4" />}
                  {saveMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Сохранить изменения
              </button>
            </form>
          </section>

          {/* Бронирования */}
          <section>
            <h2 className="mb-5 flex items-center gap-2 font-serif text-xl font-bold">
              <Ticket className="h-5 w-5 text-emerald-700" /> Мои бронирования
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-sans text-sm text-emerald-800">
                {bookings.length}
              </span>
            </h2>

            {bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-amber-300 bg-white/70 px-6 py-14 text-center">
                <p className="text-stone-600">У вас пока нет бронирований.</p>
                <Link
                  href="/"
                  className="mt-4 inline-block rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800"
                >
                  Выбрать санаторий
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {bookings.map((b) => {
                  const san = one(b.sanatoriums);
                  const room = one(b.rooms);
                  const st = statusView(b.status);
                  const nights = nightsBetween(b.check_in, b.check_out);
                  return (
                    <li
                      key={b.id}
                      className="rounded-2xl bg-white p-5 shadow-lg shadow-emerald-900/10"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold leading-snug">
                            {san ? (
                              <Link
                                href={`/sanatorium/${san.slug}`}
                                className="hover:text-emerald-700"
                              >
                                {san.name}
                              </Link>
                            ) : (
                              'Санаторий'
                            )}
                          </h3>
                          {san?.address && (
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-500">
                              <MapPin className="h-3.5 w-3.5" /> {san.address}
                            </p>
                          )}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-stone-500">Номер</dt>
                          <dd className="font-semibold">
                            {room ? `${room.category} · ${room.title}` : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1 text-stone-500">
                            <CalendarDays className="h-3.5 w-3.5" /> Даты
                          </dt>
                          <dd className="font-semibold">
                            {formatDate(b.check_in)} — {formatDate(b.check_out)}
                            {nights > 0 && (
                              <span className="font-normal text-stone-500"> ({nights} сут.)</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="flex items-center gap-1 text-stone-500">
                            <Users className="h-3.5 w-3.5" /> Гостей
                          </dt>
                          <dd className="font-semibold">{b.guests_count}</dd>
                        </div>
                        <div>
                          <dt className="text-stone-500">Сумма</dt>
                          <dd className="text-xl font-bold text-emerald-700">
                            {formatPrice(b.total_price)}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-3 text-xs text-stone-400">
                        Оформлена {formatDate(b.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}