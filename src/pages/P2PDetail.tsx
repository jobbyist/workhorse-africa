import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Users, Cog, Fuel, MapPin, ArrowLeft, Car, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const P2PDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [v, setV] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('p2p_listings').select('*').eq('id', id).single().then(({ data }) => { setV(data); setLoading(false); });
  }, [id]);

  const days = start && end ? Math.max(1, Math.ceil((+new Date(end) - +new Date(start)) / 86400000)) : 0;
  const subtotal = days * Number(v?.daily_rate || 0);
  const commission = subtotal * 0.05;
  const total = subtotal + commission;

  const handleBook = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/auth'); return; }
    if (!start || !end || days < 1) { toast.error('Pick valid dates'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('p2p_bookings').insert({
      listing_id: v.id, renter_id: user.id, owner_id: v.owner_id,
      start_date: start, end_date: end, total_amount: total, commission_amount: commission, message: msg,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Booking request sent to owner');
    navigate('/my-rentals');
  };

  if (loading) return <><Navbar /><div className="pt-32 max-w-5xl mx-auto px-4"><div className="h-96 bg-secondary rounded-2xl animate-pulse" /></div></>;
  if (!v) return <><Navbar /><div className="pt-32 text-center"><p>Listing not found.</p></div></>;

  return (
    <>
      <SEOHead title={`${v.year} ${v.make} ${v.model} for rent in ${v.city} | Dyrovo`} description={v.description?.slice(0, 160) || `Rent a ${v.make} ${v.model} from a local owner in ${v.city}.`} />
      <Navbar />
      <div className="pt-20 min-h-screen bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back to marketplace</Link>
          <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
            <div>
              <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-background shadow-soft flex items-center justify-center">
                {v.primary_image_url ? <img src={v.primary_image_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" /> : <Car className="w-20 h-20 text-muted-foreground" />}
              </div>
              <div className="mt-6 bg-background rounded-2xl p-6 shadow-soft border border-border">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{v.year} {v.make} {v.model}</h1>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2"><MapPin className="w-4 h-4" /> {v.city}{v.location ? ` · ${v.location}` : ''}</div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                  <div><div className="text-xs text-muted-foreground uppercase">Transmission</div><div className="flex items-center gap-1.5 mt-1 font-semibold capitalize"><Cog className="w-4 h-4 text-accent" /> {v.transmission}</div></div>
                  <div><div className="text-xs text-muted-foreground uppercase">Seats</div><div className="flex items-center gap-1.5 mt-1 font-semibold"><Users className="w-4 h-4 text-accent" /> {v.seats}</div></div>
                  <div><div className="text-xs text-muted-foreground uppercase">Fuel</div><div className="flex items-center gap-1.5 mt-1 font-semibold capitalize"><Fuel className="w-4 h-4 text-accent" /> {v.fuel_type}</div></div>
                </div>
                {v.description && <p className="mt-6 pt-6 border-t border-border text-foreground/80 whitespace-pre-wrap">{v.description}</p>}
              </div>
            </div>
            <aside className="md:sticky md:top-24 self-start bg-background rounded-2xl p-6 shadow-elevated border border-border">
              <div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-bold">R{Math.round(Number(v.daily_rate))}</span><span className="text-muted-foreground">/day</span></div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Calendar className="w-3.5 h-3.5" /> Start</label>
                  <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
                </div>
                <div>
                  <label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Calendar className="w-3.5 h-3.5" /> End</label>
                  <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} min={start} className="w-full px-3 py-2 rounded-xl border border-border bg-background" />
                </div>
                <textarea placeholder="Message to owner (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-border bg-background resize-none" />
              </div>
              {days > 0 && (
                <div className="mt-4 pt-4 border-t border-border text-sm space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">R{Math.round(Number(v.daily_rate))} × {days} days</span><span>R{Math.round(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service fee (5%)</span><span>R{Math.round(commission)}</span></div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border"><span>Total</span><span>R{Math.round(total)}</span></div>
                </div>
              )}
              <button onClick={handleBook} disabled={submitting || days < 1} className="mt-5 w-full px-5 py-3.5 rounded-xl bg-gradient-electric text-white font-bold disabled:opacity-50 shadow-glow">
                {submitting ? 'Sending…' : 'Request booking'}
              </button>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default P2PDetail;
