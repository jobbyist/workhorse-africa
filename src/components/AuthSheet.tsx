import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [listingIntent, setListingIntent] = useState<'sell' | 'rent-lease'>('sell');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              listingIntent,
            },
          }
        });
        
        if (error) throw error;
        
        toast({
          title: 'Account created!',
          description: 'You can now sign in with your credentials.'
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.'
        });
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black opacity-50 z-[1000]"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-[1001] shadow-2xl transition-transform duration-300 ${isOpen ? 'animate-slide-in-right' : ''}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-black hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="flex flex-col h-full px-10 pt-24 pb-10">
          <h2 className="text-black text-4xl font-medium mb-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            {isSignUp 
              ? 'Create an account to list vehicles for sale or rent/lease.' 
              : 'Welcome back! Please sign in to continue'}
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            {isSignUp ? (
              <fieldset className="flex flex-col gap-3">
                <legend className="text-black text-sm font-medium uppercase tracking-wide">
                  I want to
                </legend>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="listing-intent"
                    value="sell"
                    checked={listingIntent === 'sell'}
                    onChange={() => setListingIntent('sell')}
                    className="h-4 w-4 border-black/20 text-blue-600 focus:ring-blue-600"
                  />
                  Sell my car
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="listing-intent"
                    value="rent-lease"
                    checked={listingIntent === 'rent-lease'}
                    onChange={() => setListingIntent('rent-lease')}
                    className="h-4 w-4 border-black/20 text-blue-600 focus:ring-blue-600"
                  />
                  Rent or lease my car
                </label>
                <p className="text-xs text-gray-500">
                  We’ll tailor your onboarding for selling or rentals/leases.
                </p>
              </fieldset>
            ) : null}
            <div>
              <label htmlFor="email" className="block text-black text-sm font-medium mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-black/20 text-black px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-black text-sm font-medium mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white border border-black/20 text-black px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white font-medium py-3 px-6 uppercase text-sm border border-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-600 hover:text-black transition-colors text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
