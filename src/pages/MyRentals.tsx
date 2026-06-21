import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Car, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const MyRentals = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState<'listings' | 'bookings'>('listings');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth'); return; }
      setUser(user);
      supabase.from('p2p_listings').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setListings(data || []));
      supabase.from('p2p_bookings').select('*, p2p_listings(make, model, year)').or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`).order('created_at', { ascending: false }).then(({ data }) => setBookings(data || []));
    });
  }, [navigate]);

  const deleteListing = async (id: string) => {
    if (!confirm('Remove this listing?')) return;
    const { error } = await supabase.from('p2p_listings').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Removed'); setListings(listings.filter(l => l.id !== id)); }
  };

  return (
    <>
      <SEOHead title="My Dashboard | Dyrovo" />
      <Navbar />
      <div className="pt-24 min-h-screen bg-secondary/30 pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
            <Link to="/list-rental" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-electric text-white font-semibold"><Plus className="w-4 h-4" /> New listing</Link>
          </div>
          <div className="flex gap-2 mb-6 border-b border-border">
            <button onClick={() => setTab('listings')} className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${tab === 'listings' ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground'}`}>My listings ({listings.length})</button>
            <button onClick={() => setTab('bookings')} className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${tab === 'bookings' ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground'}`}>Bookings ({bookings.length})</button>
          </div>

          {tab === 'listings' ? (
            listings.length === 0 ? (
              <div className="text-center py-16 bg-background rounded-2xl border border-border">
                <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-semibold">No listings yet</p>
                <Link to="/list-rental" className="mt-4 inline-flex px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold">List your first car</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listings.map(l => (
                  <div key={l.id} className="bg-background rounded-2xl p-5 border border-border shadow-soft flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-secondary overflow-hidden flex-shrink-0">{l.primary_image_url && <img src={l.primary_image_url} alt={l.model} className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/p2p/${l.id}`} className="font-bold hover:text-accent block truncate">{l.year} {l.make} {l.model}</Link>
                      <div className="text-xs text-muted-foreground">{l.city}</div>
                      <div className="text-sm font-semibold mt-1">R{Math.round(Number(l.daily_rate))}/day</div>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>{l.status}</span>
                        <button onClick={() => deleteListing(l.id)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            bookings.length === 0 ? (
              <div className="text-center py-16 bg-background rounded-2xl border border-border"><p className="text-muted-foreground">No bookings yet</p></div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="bg-background rounded-2xl p-5 border border-border shadow-soft flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="font-bold">{b.p2p_listings?.year} {b.p2p_listings?.make} {b.p2p_listings?.model}</div>
                      <div className="text-xs text-muted-foreground">{b.start_date} → {b.end_date} · You are the {b.renter_id === user?.id ? 'renter' : 'owner'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">R{Math.round(Number(b.total_amount))}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary capitalize">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default MyRentals;
