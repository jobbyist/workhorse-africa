import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const VEHICLES = ['Lamborghini Huracan', 'Ferrari Roma', 'Porsche 911', 'Bentley Continental GT', 'Rolls Royce Ghost', 'BMW M5', 'Mercedes-AMG GT', 'Range Rover Sport SVR', 'Other'];
const PLANS = [
  { name: 'Starter', price: 99, features: ['Member-only rental discounts', 'Email priority support', 'Monthly luxury newsletter'] },
  { name: 'Premium', price: 199, popular: true, features: ['Everything in Starter', '24/7 booking concierge', 'Priority luxury inventory access', 'Partner offers (hotels, jets)'] },
  { name: 'Elite', price: 299, features: ['Everything in Premium', 'Dedicated VIP concierge', 'Free luxury upgrades', 'Exclusive event invites'] },
];

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().min(7, 'Enter your phone').max(30),
  city: z.string().trim().min(2).max(100),
  desired_vehicle: z.string().max(100),
});

const Luxury = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', desired_vehicle: VEHICLES[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('luxury_waitlist').insert(parsed.data);
    setSubmitting(false);
    if (error) { toast.error('Could not join the waitlist'); return; }
    setSubmitted(true);
    toast.success("You're on the list — we'll be in touch.");
  };

  return (
    <>
      <SEOHead title="Dyrovo Luxury Club — Lamborghini, Ferrari, Porsche & more" description="Join the exclusive Luxury Club for member-only discounts, priority bookings and VIP concierge on the world's most desirable vehicles in South Africa." />
      <Navbar />

      {/* HERO */}
      <section className="relative bg-gradient-hero pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, hsl(42 87% 55%) 0%, transparent 50%), radial-gradient(circle at 20% 70%, hsl(217 91% 60%) 0%, transparent 50%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-medium mb-6">
            <Crown className="w-3.5 h-3.5" /> Early access — coming soon
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
            The <span className="text-gradient-gold">Luxury Club</span> by Dyrovo
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Exclusive luxury vehicle rental discounts coming soon. Be the first to drive the world's most desirable cars across South Africa.
          </p>
        </div>
      </section>

      {/* WAITLIST */}
      <section className="py-20 bg-background">
        <div className="max-w-2xl mx-auto px-4 md:px-8">
          <div className="bg-card rounded-3xl shadow-elevated border border-border p-8 md:p-10">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gradient-gold mx-auto flex items-center justify-center mb-5"><Check className="w-8 h-8 text-gold-foreground" /></div>
                <h2 className="text-2xl font-bold">You're on the list</h2>
                <p className="text-muted-foreground mt-2">We'll email you the moment Luxury Club opens.</p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-2">Join the waitlist</h2>
                <p className="text-muted-foreground mb-6">Limited spots. No spam, just first access.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent" />
                    <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent" />
                    <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                  <select value={form.desired_vehicle} onChange={(e) => setForm({ ...form, desired_vehicle: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent">
                    {VEHICLES.map((v) => <option key={v}>{v}</option>)}
                  </select>
                  <button type="submit" disabled={submitting} className="w-full px-6 py-3.5 rounded-xl bg-gradient-gold text-gold-foreground font-bold shadow-gold hover:opacity-95 transition disabled:opacity-50">
                    {submitting ? 'Joining…' : 'Reserve my spot'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-gold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5"><Sparkles className="w-4 h-4" /> Membership tiers</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Choose your level of luxury</h2>
            <p className="text-muted-foreground mt-3">Activates when partners go live. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <div key={p.name} className={`relative rounded-3xl p-7 border-2 ${p.popular ? 'border-gold bg-gradient-navy text-white shadow-gold' : 'border-border bg-background'}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-gold text-gold-foreground text-xs font-bold uppercase tracking-wider">Most popular</div>}
                <div className="font-bold text-xl mb-1">{p.name}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-bold">R{p.price}</span>
                  <span className={p.popular ? 'text-white/60' : 'text-muted-foreground'}>/month</span>
                </div>
                <ul className="space-y-3 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.popular ? 'text-gold' : 'text-accent'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button disabled className={`w-full px-4 py-3 rounded-xl font-semibold cursor-not-allowed opacity-60 ${p.popular ? 'bg-gradient-gold text-gold-foreground' : 'bg-foreground text-background'}`}>Available at launch</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Luxury;
