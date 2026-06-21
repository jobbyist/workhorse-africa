import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const CITIES = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'];

const schema = z.object({
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  city: z.string().min(1),
  location: z.string().max(200).optional(),
  daily_rate: z.coerce.number().positive().max(100000),
  weekly_rate: z.coerce.number().positive().max(500000).optional().or(z.literal('').transform(() => undefined)),
  monthly_rate: z.coerce.number().positive().max(2000000).optional().or(z.literal('').transform(() => undefined)),
  transmission: z.enum(['automatic', 'manual']),
  fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']),
  seats: z.coerce.number().int().min(1).max(20),
  description: z.string().max(2000).optional(),
  primary_image_url: z.string().url().max(500).optional().or(z.literal('').transform(() => undefined)),
  contact_email: z.string().email().max(255).optional().or(z.literal('').transform(() => undefined)),
  contact_phone: z.string().max(30).optional(),
});

const ListRental = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    make: '', model: '', year: '2022', city: 'Johannesburg', location: '',
    daily_rate: '', weekly_rate: '', monthly_rate: '',
    transmission: 'automatic', fuel_type: 'petrol', seats: '5',
    description: '', primary_image_url: '', contact_email: '', contact_phone: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate('/auth');
      setUser(user);
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('p2p_listings').insert({ ...parsed.data, owner_id: user.id } as any);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Listing published');
    navigate('/my-rentals');
  };

  const input = 'w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent';

  return (
    <>
      <SEOHead title="List your car for rent | Dyrovo" description="Earn from your car. List it on Dyrovo's peer-to-peer marketplace in minutes." />
      <Navbar />
      <div className="pt-24 min-h-screen bg-secondary/30 pb-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">List your car for rent</h1>
          <p className="text-muted-foreground mb-8">Reach thousands of renters. 5% platform fee on completed bookings.</p>
          <form onSubmit={handleSubmit} className="bg-background rounded-2xl shadow-soft border border-border p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Make</label><input required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className={input} placeholder="Toyota" /></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Model</label><input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={input} placeholder="Corolla" /></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Year</label><input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={input} /></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Seats</label><input required type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} className={input} /></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Transmission</label><select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} className={input}><option>automatic</option><option>manual</option></select></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Fuel</label><select value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} className={input}><option>petrol</option><option>diesel</option><option>hybrid</option><option>electric</option></select></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">City</label><select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input}>{CITIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Suburb / area</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={input} placeholder="Sandton" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Daily (R)</label><input required type="number" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} className={input} placeholder="500" /></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Weekly (R)</label><input type="number" value={form.weekly_rate} onChange={(e) => setForm({ ...form, weekly_rate: e.target.value })} className={input} /></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Monthly (R)</label><input type="number" value={form.monthly_rate} onChange={(e) => setForm({ ...form, monthly_rate: e.target.value })} className={input} /></div>
            </div>
            <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Photo URL</label><input value={form.primary_image_url} onChange={(e) => setForm({ ...form, primary_image_url: e.target.value })} className={input} placeholder="https://..." /></div>
            <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Description</label><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${input} resize-none`} placeholder="Tell renters about your car…" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Contact email</label><input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className={input} /></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Contact phone</label><input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className={input} /></div>
            </div>
            <button disabled={submitting} type="submit" className="w-full px-6 py-3.5 rounded-xl bg-gradient-electric text-white font-bold shadow-glow disabled:opacity-50">{submitting ? 'Publishing…' : 'Publish listing'}</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ListRental;
