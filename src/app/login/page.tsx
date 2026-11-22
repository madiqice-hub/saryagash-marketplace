'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Droplets, Loader2, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Method = 'phone' | 'email';
type EmailMode = 'signin' | 'signup';

/** Приводит номер к формату +7XXXXXXXXXX или возвращает null */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return `+7${digits.slice(1)}`;
  if (digits.length === 10) return `+7${digits}`;
  return null;
}

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Неверная почта или пароль.';
  if (m.includes('already registered')) return 'Эта почта уже зарегистрирована. Выберите вход.';
  if (m.includes('email not confirmed')) return 'Подтвердите почту по ссылке из письма и войдите снова.';
  if (m.includes('token') && (m.includes('expired') || m.includes('invalid')))
    return 'Код неверный или устарел. Запросите новый.';
  if (m.includes('rate limit') || m.includes('seconds')) return 'Слишком много попыток. Подождите немного.';
  if (m.includes('provider') || m.includes('sms')) return 'Не удалось отправить SMS. Попробуйте позже или войдите по почте.';
  if (m.includes('password')) return 'Пароль должен содержать не менее 6 символов.';
  return 'Что-то пошло не так. Попробуйте ещё раз.';
}

export default function LoginPage() {
  const router = useRouter();

  const [method, setMethod] = useState<Method>('phone');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');

  // телефон
  const [phone, setPhone] = useState('+7 ');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // почта
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Уже вошёл — сразу в кабинет
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/profile');
    });
  }, [router]);

  // Таймер повторной отправки кода
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const switchMethod = (m: Method) => {
    setMethod(m);
    setError(null);
    setInfo(null);
  };

  const sendOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    const normalized = normalizePhone(phone);
    if (!normalized) return setError('Введите номер в формате +7 7XX XXX XX XX.');

    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: normalized });
    setLoading(false);

    if (err) return setError(translateError(err.message));
    setOtpSent(true);
    setCode('');
    setCooldown(60);
    setInfo(`Мы отправили код на ${normalized}.`);
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalized = normalizePhone(phone);
    if (!normalized) return setError('Проверьте номер телефона.');
    if (!/^\d{6}$/.test(code)) return setError('Введите 6-значный код из SMS.');

    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: code,
      type: 'sms',
    });
    if (err) {
      setLoading(false);
      return setError(translateError(err.message));
    }
    router.replace('/profile');
  };

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Введите корректный email.');
    if (password.length < 6) return setError('Пароль должен содержать не менее 6 символов.');
    if (emailMode === 'signup' && !fullName.trim()) return setError('Введите ваше имя.');

    setLoading(true);
    if (emailMode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setLoading(false);
        return setError(translateError(err.message));
      }
      router.replace('/profile');
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (err) return setError(translateError(err.message));

    if (data.session) {
      router.replace('/profile');
    } else {
      setInfo('Аккаунт создан. Подтвердите почту по ссылке из письма, затем войдите.');
      setEmailMode('signin');
      setPassword('');
    }
  };

  const inputCls =
    'w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-3 text-emerald-950 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-400';

  return (
    <div className="grid min-h-screen bg-stone-50 text-emerald-950 md:grid-cols-2">
      {/* Декоративная панель */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-600 to-amber-200 p-10 text-white md:flex">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Droplets className="h-5 w-5" />
          </span>
          Saryagash Resort
        </Link>
        <div>
          <h2 className="font-serif text-4xl font-bold leading-tight">
            Лечение и отдых на минеральных водах Сарыагаша
          </h2>
          <p className="mt-4 max-w-md text-white/90">
            Войдите, чтобы бронировать номера и следить за своими путёвками в личном кабинете.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/80">
          <ShieldCheck className="h-4 w-4" /> Данные защищены
        </p>
      </aside>

      {/* Форма */}
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Назад ко всем санаториям
          </Link>

          <div className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-900/10 sm:p-8">
            <h1 className="font-serif text-2xl font-bold">Вход и регистрация</h1>
            <p className="mt-1 text-sm text-stone-600">
              Выберите удобный способ. Новый аккаунт создаётся автоматически при входе по телефону.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-amber-50 p-1">
              {(
                [
                  ['phone', 'По телефону', Phone],
                  ['email', 'По email', Mail],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMethod(key)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition ${
                    method === key ? 'bg-white text-emerald-700 shadow' : 'text-stone-500'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {method === 'phone' && (
              <form onSubmit={otpSent ? verifyOtp : sendOtp} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold">
                  Номер телефона
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-emerald-700" />
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={otpSent}
                      placeholder="+7 7XX XXX XX XX"
                      className={`${inputCls} disabled:bg-stone-100`}
                    />
                  </div>
                </label>

                {otpSent && (
                  <label className="block text-sm font-semibold">
                    Код из SMS
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="mt-1 w-full rounded-xl border border-amber-200 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-teal-400"
                      autoFocus
                    />
                  </label>
                )}

                <Feedback error={error} info={info} />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {otpSent ? 'Подтвердить и войти' : 'Получить код'}
                </button>

                {otpSent && (
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setCode('');
                        setError(null);
                        setInfo(null);
                      }}
                      className="font-semibold text-emerald-700 hover:underline"
                    >
                      Изменить номер
                    </button>
                    <button
                      type="button"
                      disabled={cooldown > 0 || loading}
                      onClick={() => sendOtp()}
                      className="font-semibold text-emerald-700 hover:underline disabled:text-stone-400 disabled:no-underline"
                    >
                      {cooldown > 0 ? `Отправить снова через ${cooldown} с` : 'Отправить код снова'}
                    </button>
                  </div>
                )}
              </form>
            )}

            {method === 'email' && (
              <form onSubmit={submitEmail} className="mt-5 space-y-4">
                <div className="flex gap-4 text-sm font-bold">
                  {(
                    [
                      ['signin', 'Вход'],
                      ['signup', 'Регистрация'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setEmailMode(key);
                        setError(null);
                        setInfo(null);
                      }}
                      className={`border-b-2 pb-1 ${
                        emailMode === key
                          ? 'border-emerald-700 text-emerald-700'
                          : 'border-transparent text-stone-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {emailMode === 'signup' && (
                  <label className="block text-sm font-semibold">
                    Имя и фамилия
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-emerald-700" />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        placeholder="Айдана Серикова"
                        className={inputCls}
                      />
                    </div>
                  </label>
                )}

                <label className="block text-sm font-semibold">
                  Электронная почта
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-emerald-700" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="name@mail.kz"
                      className={inputCls}
                    />
                  </div>
                </label>

                <label className="block text-sm font-semibold">
                  Пароль
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-emerald-700" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={emailMode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="Не менее 6 символов"
                      className={inputCls}
                    />
                  </div>
                </label>

                <Feedback error={error} info={info} />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {emailMode === 'signin' ? 'Войти' : 'Создать аккаунт'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Feedback({ error, info }: { error: string | null; info: string | null }) {
  if (!error && !info) return null;
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`rounded-xl px-3 py-2 text-sm ${
        error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
      }`}
    >
      {error ?? info}
    </p>
  );
}