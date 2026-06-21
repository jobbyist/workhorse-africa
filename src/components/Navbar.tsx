import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { AuthSheet } from './AuthSheet';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/compare', label: 'Compare' },
  { to: '/luxury', label: 'Luxury Club', gold: true },
  { to: '/marketplace', label: 'Marketplace' },
];

export const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && pendingRoute) {
      navigate(pendingRoute);
      setPendingRoute(null);
      setIsAuthOpen(false);
    }
  }, [user, pendingRoute, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onDark = location.pathname === '/';

  const handleListClick = () => {
    if (user) navigate('/list-rental');
    else { setPendingRoute('/list-rental'); setIsAuthOpen(true); }
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || !onDark ? 'bg-background/85 backdrop-blur-xl border-b border-border shadow-soft' : 'bg-transparent',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-electric flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className={cn('text-xl font-bold tracking-tight', scrolled || !onDark ? 'text-foreground' : 'text-white')}>
              Dyrovo
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
                  scrolled || !onDark ? 'text-foreground/80 hover:text-foreground hover:bg-secondary' : 'text-white/80 hover:text-white hover:bg-white/10',
                )}
              >
                {l.gold && <Sparkles className="w-3.5 h-3.5 text-gold" />}
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleListClick}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-electric text-white hover:opacity-90 transition-opacity shadow-soft"
            >
              List your car
            </button>
            {user ? (
              <>
                <Link to="/my-rentals" className={cn('px-3 py-2 text-sm font-medium rounded-lg', scrolled || !onDark ? 'text-foreground hover:bg-secondary' : 'text-white hover:bg-white/10')}>Dashboard</Link>
                <button onClick={() => supabase.auth.signOut()} className={cn('px-3 py-2 text-sm', scrolled || !onDark ? 'text-muted-foreground hover:text-foreground' : 'text-white/70 hover:text-white')}>Sign out</button>
              </>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className={cn('px-4 py-2 text-sm font-medium rounded-lg border', scrolled || !onDark ? 'border-border text-foreground hover:bg-secondary' : 'border-white/20 text-white hover:bg-white/10')}>Sign in</button>
            )}
          </div>

          <button onClick={() => setMobileOpen(true)} className={cn('md:hidden p-2 rounded-lg', scrolled || !onDark ? 'text-foreground' : 'text-white')}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] bg-background animate-fade-in md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-electric flex items-center justify-center"><span className="text-white font-bold">D</span></div>
              <span className="text-xl font-bold">Dyrovo</span>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="p-2"><X className="w-6 h-6" /></button>
          </div>
          <div className="p-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="px-4 py-4 text-lg font-medium rounded-xl hover:bg-secondary flex items-center gap-2">
                {l.gold && <Sparkles className="w-4 h-4 text-gold" />}
                {l.label}
              </Link>
            ))}
            <button onClick={() => { handleListClick(); setMobileOpen(false); }} className="mt-4 px-4 py-4 text-lg font-semibold rounded-xl bg-gradient-electric text-white text-left">
              List your car
            </button>
            {user ? (
              <>
                <Link to="/my-rentals" onClick={() => setMobileOpen(false)} className="px-4 py-4 text-lg rounded-xl hover:bg-secondary">Dashboard</Link>
                <button onClick={async () => { await supabase.auth.signOut(); setMobileOpen(false); }} className="px-4 py-4 text-lg rounded-xl text-left hover:bg-secondary">Sign out</button>
              </>
            ) : (
              <button onClick={() => { setIsAuthOpen(true); setMobileOpen(false); }} className="px-4 py-4 text-lg rounded-xl border border-border text-left">Sign in</button>
            )}
          </div>
        </div>
      )}

      <AuthSheet isOpen={isAuthOpen} onClose={() => { setIsAuthOpen(false); setPendingRoute(null); }} />
    </>
  );
};
