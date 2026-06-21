import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Sparkles, Car, Shield, Zap, Star, ArrowRight, Crown, TrendingUp } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const CITIES = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'];

const Home = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [city, setCity] = useState('Johannesburg');
  const [pickup, setPickup] = useState(today);
  const [ret, setRet] = useState(inAWeek);
  const [featured, setFeatured] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('rental_listings').select('*, rental_suppliers(name, slug, rating)').eq('is_active', true).order('daily_rate').limit(8).then(({ data }) => setFeatured(data || []));
    supabase.from('rental_suppliers').select('*').order('rating', { ascending: false }).then(({ data }) => setSuppliers(data || []));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/compare?city=${encodeURIComponent(city)}&pickup=${pickup}&return=${ret}`);
  };

  return (
    <>
      <SEOHead title="Dyrovo — Compare Car Rentals Across South Africa" description="Compare hundreds of vehicle rental options, unlock luxury vehicle discounts and rent directly from owners. The smartest way to compare, book and save." />
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[95vh] bg-gradient-hero flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, hsl(217 91% 60%) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(42 87% 55%) 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-gold" /> The smartest way to compare, book and save
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
              Compare Car Rental Prices Across <span className="text-gradient-electric">South Africa</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
              Compare hundreds of vehicle rental options, unlock luxury vehicle discounts and rent directly from vehicle owners.
            </p>
          </div>

          {/* Search card */}
          <form onSubmit={handleSearch} className="glass rounded-2xl p-4 md:p-6 shadow-elevated max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5" /> Pickup location</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent text-foreground font-medium">
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Calendar className="w-3.5 h-3.5" /> Pickup</label>
                <input type="date" value={pickup} onChange={(e) => setPickup(e.target.value)} min={today} className="w-full px-3 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Calendar className="w-3.5 h-3.5" /> Return</label>
                <input type="date" value={ret} onChange={(e) => setRet(e.target.value)} min={pickup} className="w-full px-3 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
            <button type="submit" className="mt-4 w-full md:w-auto md:ml-auto md:flex px-8 py-3.5 rounded-xl bg-gradient-electric text-white font-semibold hover:opacity-90 transition shadow-glow items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Search 100s of cars
            </button>
          </form>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> Free cancellation on most rentals</div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-gold" /> Instant price comparison</div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-gold" /> Trusted by thousands</div>
          </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Popular destinations</p>
              <h2 className="text-4xl font-bold tracking-tight">Where do you want to drive?</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CITIES.map((c) => (
              <Link key={c} to={`/compare?city=${encodeURIComponent(c)}`} className="group relative aspect-square rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all">
                <div className="absolute inset-0 bg-gradient-navy group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-4 flex items-end">
                  <div>
                    <div className="text-white font-semibold text-lg leading-tight">{c}</div>
                    <div className="text-white/60 text-xs mt-1 group-hover:text-accent transition-colors">From R310/day</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TOP SUPPLIERS */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-10">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Trusted partners</p>
            <h2 className="text-4xl font-bold tracking-tight">9 top rental suppliers in one search</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {suppliers.map((s) => (
              <div key={s.id} className="aspect-[3/2] rounded-xl glass flex flex-col items-center justify-center p-3 hover:shadow-soft transition-shadow text-center">
                <div className="text-sm font-bold text-foreground leading-tight">{s.name}</div>
                <div className="flex items-center gap-0.5 mt-1.5"><Star className="w-3 h-3 fill-gold text-gold" /><span className="text-xs text-muted-foreground">{Number(s.rating).toFixed(1)}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LUXURY CLUB */}
      <section className="py-20 bg-gradient-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, hsl(42 87% 55%) 0%, transparent 60%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-medium mb-6">
              <Crown className="w-3.5 h-3.5" /> Dyrovo Luxury Club
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Lamborghini. Ferrari. Porsche. <span className="text-gradient-gold">All on call.</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Join the exclusive Luxury Club for priority bookings, VIP concierge and member-only discounts on the world's most desirable vehicles.
            </p>
            <Link to="/luxury" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-gold text-gold-foreground font-semibold hover:opacity-90 transition shadow-gold">
              Join the waitlist <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Lamborghini Huracan', 'Ferrari Roma', 'Porsche 911', 'Bentley Continental'].map((n, i) => (
              <div key={n} className={cn('rounded-2xl aspect-[4/5] bg-gradient-to-br from-white/5 to-white/0 border border-white/10 p-5 flex flex-col justify-between', i % 2 === 1 && 'translate-y-8')}>
                <Crown className="w-6 h-6 text-gold" />
                <div>
                  <div className="text-white/50 text-xs">Coming soon</div>
                  <div className="text-white font-semibold mt-1">{n}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED VEHICLES */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Featured deals</p>
              <h2 className="text-4xl font-bold tracking-tight">Best rentals today</h2>
            </div>
            <Link to="/compare" className="hidden md:flex items-center gap-1 text-accent font-medium hover:gap-2 transition-all">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((v) => (
              <Link key={v.id} to={`/rental/${v.id}`} className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all border border-border">
                <div className="aspect-[4/3] bg-secondary overflow-hidden">
                  {v.image_url && <img src={v.image_url} alt={`${v.make} ${v.model}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-xs text-muted-foreground font-medium">{v.rental_suppliers?.name}</div>
                    <div className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-gold text-gold" /><span className="text-xs">{Number(v.rental_suppliers?.rating || 4).toFixed(1)}</span></div>
                  </div>
                  <div className="font-semibold text-foreground leading-tight">{v.make} {v.model}</div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">{v.category} • {v.transmission} • {v.seats} seats</div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">R{Math.round(Number(v.daily_rate))}</div>
                      <div className="text-xs text-muted-foreground">per day</div>
                    </div>
                    <div className="text-accent text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE / FAQ / FOOTER */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Peer-to-peer</p>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Rent direct from local owners</h2>
            <p className="text-muted-foreground text-lg mb-6">Skip the airport queue. Browse unique cars listed by South Africans and book with confidence.</p>
            <div className="flex gap-3">
              <Link to="/marketplace" className="px-6 py-3 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition">Browse marketplace</Link>
              <Link to="/list-rental" className="px-6 py-3 rounded-xl border border-border font-semibold hover:bg-background transition">List your car</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[Car, Shield, Zap, Star].map((Icon, i) => (
              <div key={i} className="rounded-2xl bg-background p-5 shadow-soft">
                <Icon className="w-7 h-7 text-accent mb-3" />
                <div className="font-semibold">{['100K+ listings', 'Verified owners', 'Instant booking', '5★ ratings'][i]}</div>
                <div className="text-xs text-muted-foreground mt-1">{['Across SA', 'ID-checked', 'Same-day pickup', 'Real reviews'][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-electric flex items-center justify-center"><span className="text-white font-bold">D</span></div>
              <span className="text-xl font-bold">Dyrovo</span>
            </div>
            <p className="text-sm text-background/60">The smartest way to compare, book and save on vehicle rentals.</p>
          </div>
          {[
            { h: 'Rent', l: [['Compare', '/compare'], ['Marketplace', '/marketplace'], ['Luxury Club', '/luxury']] },
            { h: 'List', l: [['List your car', '/list-rental'], ['Dashboard', '/my-rentals']] },
            { h: 'Company', l: [['Sign in', '/auth']] },
          ].map((c) => (
            <div key={c.h}>
              <div className="font-semibold mb-3">{c.h}</div>
              <ul className="space-y-2 text-sm text-background/60">
                {c.l.map(([t, h]) => <li key={h}><Link to={h} className="hover:text-background transition">{t}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 pt-6 border-t border-background/10 text-xs text-background/40">
          © {new Date().getFullYear()} Dyrovo. Comparing rentals across South Africa.
        </div>
      </footer>
    </>
  );
};

export default Home;
