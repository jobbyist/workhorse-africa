import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Search, SlidersHorizontal, Star, Users, Fuel, Cog, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CITIES = ['All cities', 'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'];
const CATEGORIES = ['all', 'economy', 'compact', 'suv', 'luxury', 'sports', 'van'];
const SORTS = [
  { v: 'cheapest', l: 'Cheapest first' },
  { v: 'value', l: 'Best value' },
  { v: 'rated', l: 'Highest rated' },
  { v: 'luxury', l: 'Luxury first' },
];

const Compare = () => {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const city = params.get('city') || 'All cities';
  const cat = params.get('category') || 'all';
  const supplier = params.get('supplier') || 'all';
  const maxPrice = params.get('max') || '';
  const sort = params.get('sort') || 'cheapest';

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v && v !== 'all' && v !== 'All cities') next.set(k, v); else next.delete(k);
    setParams(next);
  };

  useEffect(() => {
    supabase.from('rental_suppliers').select('*').then(({ data }) => setSuppliers(data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('rental_listings').select('*, rental_suppliers(name, slug, rating)').eq('is_active', true);
    if (city !== 'All cities') q = q.eq('city', city);
    if (cat !== 'all') q = q.eq('category', cat);
    if (supplier !== 'all') q = q.eq('supplier_id', supplier);
    if (maxPrice) q = q.lte('daily_rate', Number(maxPrice));
    q.limit(200).then(({ data }) => { setListings(data || []); setLoading(false); });
  }, [city, cat, supplier, maxPrice]);

  const sorted = useMemo(() => {
    const arr = [...listings];
    if (sort === 'cheapest') arr.sort((a, b) => Number(a.daily_rate) - Number(b.daily_rate));
    if (sort === 'value') arr.sort((a, b) => Number(a.daily_rate) / (Number(a.rental_suppliers?.rating) || 4) - Number(b.daily_rate) / (Number(b.rental_suppliers?.rating) || 4));
    if (sort === 'rated') arr.sort((a, b) => Number(b.rental_suppliers?.rating || 0) - Number(a.rental_suppliers?.rating || 0));
    if (sort === 'luxury') arr.sort((a, b) => Number(b.is_luxury) - Number(a.is_luxury) || Number(b.daily_rate) - Number(a.daily_rate));
    return arr;
  }, [listings, sort]);

  const cheapest = sorted[0] ? Math.round(Number(sorted[0].daily_rate)) : null;

  return (
    <>
      <SEOHead title={`Compare car rentals in ${city} | Dyrovo`} description={`Compare prices from 9 top rental suppliers in ${city}. ${listings.length} cars available.`} />
      <Navbar />
      <div className="pt-20 min-h-screen bg-secondary/30">
        {/* Search header */}
        <div className="bg-background border-b border-border sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              <MapPin className="w-4 h-4 text-accent" />
              <select value={city} onChange={(e) => setParam('city', e.target.value)} className="bg-transparent border-none focus:outline-none font-semibold">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <span className="text-muted-foreground">·</span>
            <div className="hidden md:flex gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setParam('category', c)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium capitalize transition', cat === c ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-secondary/70')}>{c}</button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm bg-background">
                {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
              <button onClick={() => setShowFilters(true)} className="md:hidden px-3 py-2 rounded-lg border border-border flex items-center gap-1.5 text-sm"><SlidersHorizontal className="w-4 h-4" /> Filters</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar filters */}
          <aside className={cn('lg:block', showFilters ? 'fixed inset-0 z-50 bg-background p-6 overflow-y-auto' : 'hidden')}>
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h3 className="font-bold text-lg">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6 bg-background lg:rounded-2xl lg:p-5 lg:shadow-soft lg:border lg:border-border">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Supplier</div>
                <div className="space-y-1.5">
                  <button onClick={() => setParam('supplier', 'all')} className={cn('w-full text-left px-3 py-2 rounded-lg text-sm', supplier === 'all' ? 'bg-secondary font-semibold' : 'hover:bg-secondary/50')}>All suppliers</button>
                  {suppliers.map((s) => (
                    <button key={s.id} onClick={() => setParam('supplier', s.id)} className={cn('w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between', supplier === s.id ? 'bg-secondary font-semibold' : 'hover:bg-secondary/50')}>
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Star className="w-3 h-3 fill-gold text-gold" />{Number(s.rating).toFixed(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Max daily price</div>
                <input type="number" placeholder="e.g. 800" value={maxPrice} onChange={(e) => setParam('max', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div className="lg:hidden">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Category</div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setParam('category', c)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium capitalize', cat === c ? 'bg-foreground text-background' : 'bg-secondary')}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="flex items-end justify-between mb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{listings.length} cars in {city}</h1>
                {cheapest !== null && <p className="text-sm text-muted-foreground mt-1">From <span className="font-semibold text-foreground">R{cheapest}/day</span></p>}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-background animate-pulse" />)}</div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-20 bg-background rounded-2xl border border-border">
                <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold">No cars match your filters</p>
                <p className="text-sm text-muted-foreground mt-1">Try widening your search.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((v) => (
                  <Link key={v.id} to={`/rental/${v.id}`} className="group flex flex-col md:flex-row bg-background rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all border border-border">
                    <div className="md:w-72 aspect-[4/3] md:aspect-auto bg-secondary overflow-hidden flex-shrink-0">
                      {v.image_url && <img src={v.image_url} alt={`${v.make} ${v.model}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <div className="flex-1 p-5 flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground">{v.rental_suppliers?.name}</span>
                          {v.is_luxury && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/10 text-gold">Luxury</span>}
                        </div>
                        <h3 className="text-lg font-bold">{v.make} {v.model}</h3>
                        <div className="text-xs text-muted-foreground capitalize mt-0.5">{v.year} · {v.category}</div>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Cog className="w-3.5 h-3.5" /> {v.transmission}</span>
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {v.seats} seats</span>
                          <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> {v.fuel_type}</span>
                          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-gold text-gold" /> {Number(v.rental_suppliers?.rating || 4).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="md:text-right md:min-w-[140px] flex md:flex-col justify-between md:justify-center items-end gap-2">
                        <div>
                          <div className="text-3xl font-bold">R{Math.round(Number(v.daily_rate))}</div>
                          <div className="text-xs text-muted-foreground">per day</div>
                          {v.weekly_rate && <div className="text-xs text-muted-foreground mt-1">R{Math.round(Number(v.weekly_rate))}/week</div>}
                        </div>
                        <span className="px-4 py-2 rounded-xl bg-gradient-electric text-white text-sm font-semibold">View deal →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Compare;
