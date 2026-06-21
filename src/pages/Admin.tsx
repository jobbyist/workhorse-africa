import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [listings, setListings] = useState<number>(0);
  const [bookings, setBookings] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!role) { setIsAdmin(false); return; }
      setIsAdmin(true);
      const [{ data: wl }, { count: lc }, { count: bc }] = await Promise.all([
        supabase.from('luxury_waitlist').select('*').order('created_at', { ascending: false }),
        supabase.from('p2p_listings').select('*', { count: 'exact', head: true }),
        supabase.from('p2p_bookings').select('*', { count: 'exact', head: true }),
      ]);
      setWaitlist(wl || []); setListings(lc || 0); setBookings(bc || 0);
    })();
  }, [navigate]);

  if (isAdmin === null) return <><Navbar /><div className="pt-32 text-center text-muted-foreground">Loading…</div></>;
  if (!isAdmin) return <><Navbar /><div className="pt-32 max-w-md mx-auto text-center"><h1 className="text-2xl font-bold">Admins only</h1><p className="text-muted-foreground mt-2">Your account doesn't have admin access.</p></div></>;

  return (
    <>
      <SEOHead title="Admin | Dyrovo" description="Dyrovo admin dashboard" />
      <Navbar />
      <div className="pt-24 min-h-screen bg-secondary/30 pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Admin dashboard</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[['Luxury waitlist', waitlist.length], ['P2P listings', listings], ['P2P bookings', bookings]].map(([l, v]) => (
              <div key={l as string} className="bg-background rounded-2xl p-5 border border-border shadow-soft">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{l}</div>
                <div className="text-3xl font-bold mt-2">{v as number}</div>
              </div>
            ))}
          </div>
          <div className="bg-background rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border font-bold">Luxury waitlist submissions</div>
            {waitlist.length === 0 ? <div className="p-6 text-center text-muted-foreground">No submissions yet</div> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Email</th><th className="text-left px-4 py-2">Phone</th><th className="text-left px-4 py-2">City</th><th className="text-left px-4 py-2">Vehicle</th><th className="text-left px-4 py-2">When</th></tr></thead>
                <tbody>{waitlist.map(w => (
                  <tr key={w.id} className="border-t border-border"><td className="px-4 py-2.5 font-medium">{w.name}</td><td className="px-4 py-2.5">{w.email}</td><td className="px-4 py-2.5">{w.phone}</td><td className="px-4 py-2.5">{w.city}</td><td className="px-4 py-2.5">{w.desired_vehicle}</td><td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(w.created_at).toLocaleDateString()}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
