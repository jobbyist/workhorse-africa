import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Star, Users, Cog, Fuel, MapPin, ArrowLeft, Check, ExternalLink } from 'lucide-react';

const RentalDetail = () => {
  const { id } = useParams();
  const [v, setV] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('rental_listings').select('*, rental_suppliers(*)').eq('id', id).single().then(({ data }) => { setV(data); setLoading(false); });
  }, [id]);

  if (loading) return <><Navbar /><div className="pt-32 max-w-5xl mx-auto px-4"><div className="h-96 bg-secondary rounded-2xl animate-pulse" /></div></>;
  if (!v) return <><Navbar /><div className="pt-32 text-center"><p>Listing not found.</p><Link to="/compare" className="text-accent">Back to compare</Link></div></>;

  const features = Array.isArray(v.features) ? v.features : [];

  return (
    <>
      <SEOHead title={`${v.make} ${v.model} rental from ${v.rental_suppliers?.name} | Dyrovo`} description={`Rent a ${v.year} ${v.make} ${v.model} in ${v.city} from R${Math.round(Number(v.daily_rate))}/day.`} />
      <Navbar />
      <div className="pt-20 min-h-screen bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <Link to="/compare" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back to results</Link>

          <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
            <div>
              <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-background shadow-soft">
                {v.image_url && <img src={v.image_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />}
              </div>
              <div className="mt-6 bg-background rounded-2xl p-6 shadow-soft border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-muted-foreground">{v.rental_suppliers?.name}</span>
                  <div className="flex items-center gap-0.5"><Star className="w-4 h-4 fill-gold text-gold" /><span className="text-sm font-semibold">{Number(v.rental_suppliers?.rating || 4).toFixed(1)}</span></div>
                  {v.is_luxury && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gold/10 text-gold">Luxury</span>}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{v.year} {v.make} {v.model}</h1>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2"><MapPin className="w-4 h-4" /> {v.city}</div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                  <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Transmission</div><div className="flex items-center gap-1.5 mt-1 font-semibold capitalize"><Cog className="w-4 h-4 text-accent" /> {v.transmission}</div></div>
                  <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Seats</div><div className="flex items-center gap-1.5 mt-1 font-semibold"><Users className="w-4 h-4 text-accent" /> {v.seats}</div></div>
                  <div><div className="text-xs text-muted-foreground uppercase tracking-wider">Fuel</div><div className="flex items-center gap-1.5 mt-1 font-semibold capitalize"><Fuel className="w-4 h-4 text-accent" /> {v.fuel_type}</div></div>
                </div>

                {features.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Included</div>
                    <div className="grid grid-cols-2 gap-2">
                      {features.map((f: string) => <div key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-accent" /> {f}</div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="md:sticky md:top-24 self-start bg-background rounded-2xl p-6 shadow-elevated border border-border">
              <div className="text-sm text-muted-foreground">From</div>
              <div className="flex items-baseline gap-1"><span className="text-4xl font-bold">R{Math.round(Number(v.daily_rate))}</span><span className="text-muted-foreground">/day</span></div>
              {v.weekly_rate && <div className="text-sm text-muted-foreground mt-1">R{Math.round(Number(v.weekly_rate))} per week</div>}
              {v.monthly_rate && <div className="text-sm text-muted-foreground">R{Math.round(Number(v.monthly_rate))} per month</div>}

              <a href={v.rental_suppliers?.website_url || '#'} target="_blank" rel="noopener noreferrer" className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-electric text-white font-bold shadow-glow hover:opacity-90 transition">
                Book on {v.rental_suppliers?.name} <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-xs text-muted-foreground mt-3 text-center">You'll be redirected to {v.rental_suppliers?.name} to complete booking.</p>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default RentalDetail;
