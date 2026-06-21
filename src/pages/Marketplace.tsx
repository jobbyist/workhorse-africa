import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Users, Cog, Fuel, MapPin, Plus, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

const CITIES = ['All cities', 'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'];

const Marketplace = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('All cities');

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('p2p_listings').select('*').eq('status', 'active');
    if (city !== 'All cities') q = q.eq('city', city);
    q.order('created_at', { ascending: false }).then(({ data }) => { setListings(data || []); setLoading(false); });
  }, [city]);

  return (
    <>
      <SEOHead title="Peer-to-peer car rentals | Dyrovo Marketplace" description="Rent unique vehicles directly from local owners across South Africa." />
      <Navbar />
      <div className="pt-20 min-h-screen bg-secondary/30">
        <section className="bg-gradient-navy text-white py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Peer-to-peer marketplace</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Rent direct from local owners</h1>
            <p className="text-white/70 max-w-2xl text-lg">Skip the queue. Unique cars listed by South Africans, booked in minutes.</p>
            <Link to="/list-rental" className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-foreground font-semibold hover:bg-white/90"><Plus className="w-4 h-4" /> List your car</Link>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="flex items-center gap-2 mb-6 overflow-x-auto">
            {CITIES.map((c) => (
              <button key={c} onClick={() => setCity(c)} className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap', city === c ? 'bg-foreground text-background' : 'bg-background border border-border')}>{c}</button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <div key={i} className="h-80 bg-background rounded-2xl animate-pulse" />)}</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-background rounded-2xl border border-border">
              <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg">No P2P listings yet</h3>
              <p className="text-muted-foreground mt-1">Be the first to list a car in {city === 'All cities' ? 'South Africa' : city}.</p>
              <Link to="/list-rental" className="mt-5 inline-flex px-5 py-2.5 rounded-xl bg-gradient-electric text-white font-semibold">List your car</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((v) => (
                <Link key={v.id} to={`/p2p/${v.id}`} className="group bg-background rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all border border-border">
                  <div className="aspect-[4/3] bg-secondary overflow-hidden">
                    {v.primary_image_url ? <img src={v.primary_image_url} alt={`${v.make} ${v.model}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Car className="w-12 h-12" /></div>}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><MapPin className="w-3 h-3" /> {v.city}</div>
                    <h3 className="font-bold text-lg">{v.year} {v.make} {v.model}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Cog className="w-3 h-3" /> {v.transmission}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {v.seats}</span>
                      <span className="flex items-center gap-1"><Fuel className="w-3 h-3" /> {v.fuel_type}</span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div><span className="text-2xl font-bold">R{Math.round(Number(v.daily_rate))}</span><span className="text-xs text-muted-foreground">/day</span></div>
                      <span className="text-accent text-sm font-semibold">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Marketplace;
