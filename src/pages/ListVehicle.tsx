import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { AuthSheet } from '@/components/AuthSheet';
import { SEOHead } from '@/components/SEOHead';
import { z } from 'zod';
import { VEHICLE_BRANDS, VehicleBrand } from '@/constants/eventCategories';
import { AFRICAN_COUNTRIES, getCitiesByCountry } from '@/constants/africanLocations';
import { ChevronDown } from 'lucide-react';

const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT', 'Semi-Automatic'] as const;
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'] as const;
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Needs Work'] as const;

const vehicleSchema = z.object({
  title: z.string().trim().min(1, 'Vehicle title is required').max(200, 'Title must be less than 200 characters'),
  price: z.string().min(1, 'Price is required'),
  year: z.string().regex(/^\d{4}$/, 'Year must be a valid 4-digit year'),
  mileage: z.string().min(1, 'Mileage is required'),
  location: z.string().trim().min(1, 'Location is required').max(300, 'Location must be less than 300 characters'),
  description: z.string().trim().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
});

const ListVehicle = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [transmission, setTransmission] = useState<string>('Manual');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [condition, setCondition] = useState<string>('Good');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [brand, setBrand] = useState<VehicleBrand>('other');
  const [country, setCountry] = useState<string>('South Africa');
  const [city, setCity] = useState<string>('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  
  const locationInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { onPlaceSelected } = useGooglePlacesAutocomplete(locationInputRef);

  const cities = country ? getCitiesByCountry(country) : [];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setSellerEmail(session?.user?.email || '');
      if (!session?.user) {
        setShowAuthModal(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setSellerEmail(session?.user?.email || '');
      if (session?.user) {
        setShowAuthModal(false);
      } else {
        setShowAuthModal(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    onPlaceSelected((place) => {
      const address = place.formatted_address || place.name || '';
      setLocation(address);
    });
  }, [onPlaceSelected]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, GIF, or WebP image');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!imageFile) {
      toast.error('Please add a vehicle image');
      return;
    }

    const validationResult = vehicleSchema.safeParse({
      title,
      price,
      year,
      mileage,
      location,
      description,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const creatorName = profile?.display_name || user.email?.split('@')[0] || 'Anonymous';

      const { error: insertError } = await supabase
        .from('events')
        .insert({
          title,
          description,
          date: new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }),
          time: 'Listed',
          address: location,
          background_image_url: publicUrl,
          target_date: new Date().toISOString(),
          creator: creatorName,
          category: brand,
          country: country || null,
          city: city || null,
          ticket_url: null,
          ticket_price: parseFloat(price),
          year: parseInt(year),
          mileage: parseInt(mileage.replace(/\D/g, '')),
          transmission: transmission.toLowerCase(),
          fuel_type: fuelType.toLowerCase(),
          condition: condition.toLowerCase(),
          seller_phone: sellerPhone || null,
          seller_email: sellerEmail || user.email,
          is_scraped: false,
        });

      if (insertError) throw insertError;

      toast.success('Vehicle listed successfully!');
      navigate('/my-events');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error listing vehicle:', error);
      toast.error('Failed to list vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

  return (
    <>
      <SEOHead 
        title="List Your Vehicle"
        description="List your car on Workhorse - the peer-to-peer marketplace for selling or renting vehicles in South Africa"
      />
      <AuthSheet isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        
        {user ? (
          <div className="max-w-7xl mx-auto pt-24 md:pt-32 pb-8 md:pb-16 px-4 md:px-8">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-start">
              {/* Left: Image Upload */}
              <div className="flex flex-col gap-3 md:gap-4">
                <label className="w-full aspect-[4/3] border border-foreground bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Vehicle preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-foreground text-[11px] font-medium uppercase tracking-wider">
                      ADD VEHICLE PHOTO
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                
                {imagePreview && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 text-[13px] font-medium uppercase tracking-wider border border-foreground bg-background hover:bg-foreground hover:text-background transition-colors"
                  >
                    Change image
                  </button>
                )}
              </div>

              {/* Right: Form Fields */}
              <div className="space-y-4 md:space-y-6">
                <input
                  type="text"
                  placeholder="e.g. 2019 Toyota Corolla 1.8 XS"
                  className="w-full text-foreground text-[24px] md:text-[36px] lg:text-[42px] font-medium leading-tight mb-4 md:mb-6 focus:outline-none bg-transparent border-none p-0 placeholder:text-muted-foreground"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                {/* Brand & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {VEHICLE_BRANDS.find(b => b.value === brand)?.emoji}
                          {VEHICLE_BRANDS.find(b => b.value === brand)?.label || 'Brand'}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0 max-h-64 overflow-y-auto bg-background" align="start">
                      {VEHICLE_BRANDS.map((b) => (
                        <button
                          key={b.value}
                          onClick={() => setBrand(b.value)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2",
                            brand === b.value && "bg-muted font-medium"
                          )}
                        >
                          <span>{b.emoji}</span>
                          <span>{b.label}</span>
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none flex items-center justify-between">
                        <span>{year || 'Year'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0 max-h-64 overflow-y-auto bg-background" align="start">
                      {years.map((y) => (
                        <button
                          key={y}
                          onClick={() => setYear(y)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                            year === y && "bg-muted font-medium"
                          )}
                        >
                          {y}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Price & Mileage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] md:text-[17px] text-muted-foreground">R</span>
                    <input
                      type="number"
                      placeholder="Price"
                      className="w-full pl-8 pr-3 md:pl-10 md:pr-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none placeholder:text-muted-foreground bg-transparent"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Mileage (km)"
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none placeholder:text-muted-foreground bg-transparent"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                    />
                  </div>
                </div>

                {/* Transmission & Fuel Type */}
                <div className="grid grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none flex items-center justify-between">
                        <span>{transmission}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0 bg-background" align="start">
                      {TRANSMISSIONS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTransmission(t)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                            transmission === t && "bg-muted font-medium"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none flex items-center justify-between">
                        <span>{fuelType}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0 bg-background" align="start">
                      {FUEL_TYPES.map((f) => (
                        <button
                          key={f}
                          onClick={() => setFuelType(f)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                            fuelType === f && "bg-muted font-medium"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Condition */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none flex items-center justify-between">
                      <span>Condition: {condition}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0 bg-background" align="start">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCondition(c)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                          condition === c && "bg-muted font-medium"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Country & City */}
                <div className="grid grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none flex items-center justify-between">
                        <span>{country || 'Country'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0 max-h-64 overflow-y-auto bg-background" align="start">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            setCountry(c.name);
                            setCity('');
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                            country === c.name && "bg-muted font-medium"
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none flex items-center justify-between">
                        <span>{city || 'City'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0 max-h-64 overflow-y-auto bg-background" align="start">
                      {cities.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCity(c)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                            city === c && "bg-muted font-medium"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Location */}
                <input
                  ref={locationInputRef}
                  type="text"
                  placeholder="Full address"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none placeholder:text-muted-foreground bg-transparent"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none placeholder:text-muted-foreground bg-transparent"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none placeholder:text-muted-foreground bg-transparent"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                  />
                </div>

                {/* Description */}
                <textarea
                  placeholder="Describe your vehicle - include features, history, and whether you want to sell or rent/lease"
                  rows={6}
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-foreground border border-foreground focus:outline-none resize-none placeholder:text-muted-foreground bg-transparent"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                {/* Submit Button */}
                <div className="group flex items-center self-stretch relative overflow-hidden mt-4 md:mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex h-[50px] justify-center items-center gap-2.5 border relative px-2.5 py-3.5 border-solid transition-all duration-300 ease-in-out w-[calc(100%-50px)] z-10 bg-foreground border-foreground group-hover:w-full group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-blue-700 group-hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="List vehicle"
                  >
                    <span className="text-background text-[13px] font-normal uppercase relative transition-colors duration-300 group-hover:text-foreground">
                      {isSubmitting ? 'LISTING...' : 'LIST MY VEHICLE'}
                    </span>
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute right-[18px] opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      <path d="M0.857178 6H10.3929" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6.39282 10L10.3928 6L6.39282 2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                  <div className="flex w-[50px] h-[50px] justify-center items-center border absolute right-0 bg-background rounded-[99px] border-solid border-foreground transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:scale-50 pointer-events-none z-0">
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="arrow-icon"
                      aria-hidden="true"
                    >
                      <path d="M0.857178 6H10.3929" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6.39282 10L10.3928 6L6.39282 2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default ListVehicle;
