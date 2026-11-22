'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BedDouble, Stethoscope, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SanatoriumDetails({ sanatorium, rooms, doctors, programs }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rooms' | 'doctors' | 'programs'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Сначала войдите в личный кабинет!');
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      sanatorium_id: sanatorium.id,
      room_id: selectedRoom.id,
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guests,
      total_price: selectedRoom.price_per_day * guests,
    });

    setLoading(false);
    if (error) alert('Ошибка: ' + error.message);
    else {
      alert('Путевка успешно забронирована!');
      setSelectedRoom(null);
      router.push('/profile');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 mb-6">
        <button onClick={() => setActiveTab('rooms')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm ${activeTab === 'rooms' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600'}`}>
          <BedDouble className="w-4 h-4" /> Номера и цены ({rooms.length})
        </button>
        <button onClick={() => setActiveTab('doctors')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm ${activeTab === 'doctors' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600'}`}>
          <Stethoscope className="w-4 h-4" /> Врачи ({doctors.length})
        </button>
        <button onClick={() => setActiveTab('programs')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm ${activeTab === 'programs' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600'}`}>
          <Sparkles className="w-4 h-4" /> Программы ({programs.length})
        </button>
      </div>

      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room: any) => (
            <div key={room.id} className="bg-white rounded-2xl border p-5 flex flex-col">
              <span className="self-start px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold uppercase mb-3">{room.category}</span>
              <h3 className="text-lg font-bold mb-2">{room.title}</h3>
              <p className="text-sm text-slate-600 mb-4 flex-1">{room.description}</p>
              <div className="pt-4 border-t flex items-center justify-between">
                <span className="text-xl font-extrabold">{room.price_per_day.toLocaleString('ru-RU')} ₸</span>
                <button onClick={() => setSelectedRoom(room)} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium">Забронировать</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctors.length === 0 ? <p className="text-slate-500">Список врачей скоро будет добавлен.</p> : doctors.map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-2xl border p-5">
              <h4 className="font-bold">{doc.full_name}</h4>
              <p className="text-sm text-teal-600">{doc.specialty}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'programs' && (
        <div className="bg-white rounded-2xl border p-6 space-y-3">
          {programs.length === 0 ? <p className="text-slate-500">Базовое лечение входит в стоимость номера.</p> : programs.map((p: any) => (
            <div key={p.id} className="flex items-center gap-2 border-b pb-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span className="font-medium">{p.name}</span>
            </div>
          ))}
        </div>
      )}

      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleBook} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold">Бронь: {selectedRoom.category}</h3>
            <input type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <input type="number" min={1} max={5} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full border rounded-xl px-3 py-2 text-sm" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setSelectedRoom(null)} className="flex-1 py-2 rounded-xl border text-sm">Отмена</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-teal-600 text-white text-sm">{loading ? 'Ждите...' : 'Подтвердить'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
