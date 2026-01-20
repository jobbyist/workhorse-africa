import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { VEHICLE_BRANDS } from '@/constants/eventCategories';
import { getVehicleImageUrl, VEHICLE_PLACEHOLDER_IMAGE } from '@/lib/vehicleImage';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, Calendar, Gauge, Fuel, Settings2, CheckCircle } from 'lucide-react';

interface Vehicle {
  id: string;
  title: string;
  creator: string;
  description: string;
  date: string;
  address: string;
  background_image_url: string;
  target_date: string;
  category: string;
  ticket_price: number | null;
  country: string | null;
  city: string | null;
  year: number | null;
  mileage: number | null;
  transmission: string | null;
  fuel_type: string | null;
  condition: string | null;
  seller_phone: string | null;
  seller_email: string | null;
  source_url: string | null;
  is_scraped: boolean | null;
}

export const VehicleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imageSrc, setImageSrc] = useState(VEHICLE_PLACEHOLDER_IMAGE);
  
  // Inquiry form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchVehicle();
  }, [id]);

  useEffect(() => {
    if (vehicle) {
      setImageSrc(getVehicleImageUrl(vehicle));
    }
  }, [vehicle]);
  
  const fetchVehicle = async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching vehicle:', error);
      setNotFound(true);
    } else if (!data) {
      setNotFound(true);
    } else {
      setVehicle(data);
      setInquiryMessage(`Hi, I'm interested in the ${data.title}. Is it still available?`);
    }
    setLoading(false);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inquiryName || !inquiryEmail || !inquiryMessage) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('vehicle_inquiries')
        .insert({
          vehicle_id: id,
          user_id: session?.user?.id || null,
          name: inquiryName,
          email: inquiryEmail,
          phone: inquiryPhone || null,
          message: inquiryMessage,
        });

      if (error) throw error;

      toast.success('Inquiry sent successfully! The seller will contact you soon.');
      setInquiryName('');
      setInquiryEmail('');
      setInquiryPhone('');
      setInquiryMessage(`Hi, I'm interested in the ${vehicle?.title}. Is it still available?`);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error submitting inquiry:', error);
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandInfo = vehicle ? VEHICLE_BRANDS.find(b => b.value === vehicle.category) : null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-foreground text-2xl">Loading...</div>
      </div>
    );
  }

  if (notFound || !vehicle) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background px-4">
        <SEOHead 
          title="Vehicle Not Found"
          description="The vehicle you're looking for doesn't exist or has been sold."
        />
        <Navbar />
        <div className="text-center mt-20">
          <h1 className="text-4xl font-medium mb-4 text-foreground">Vehicle Not Found</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The vehicle you're looking for doesn't exist or has been sold.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-foreground text-background border border-foreground hover:bg-background hover:text-foreground transition-colors uppercase text-sm font-medium"
          >
            Browse Vehicles
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={vehicle.title}
        description={vehicle.description.substring(0, 160)}
        image={imageSrc}
        keywords={`${vehicle.title}, ${brandInfo?.label || ''}, used cars, pre-owned vehicles, South Africa`}
      />
      <Navbar />

      <main className="min-h-screen bg-background pt-24 md:pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
            {/* Left: Vehicle Info */}
            <div>
              {/* Main Image */}
              <div className="aspect-[4/3] w-full bg-muted mb-6 overflow-hidden">
                <img 
                  src={imageSrc} 
                  alt={vehicle.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageSrc(VEHICLE_PLACEHOLDER_IMAGE)}
                />
              </div>

              {/* Title & Price */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {brandInfo && (
                    <span className="px-3 py-1 text-[11px] font-medium uppercase border border-foreground bg-background">
                      {brandInfo.emoji} {brandInfo.label}
                    </span>
                  )}
                  {vehicle.year && (
                    <span className="px-3 py-1 text-[11px] font-medium uppercase border border-foreground bg-background">
                      {vehicle.year}
                    </span>
                  )}
                  {vehicle.country && (
                    <span className="px-3 py-1 text-[11px] font-medium uppercase border border-foreground bg-background">
                      📍 {vehicle.city ? `${vehicle.city}, ` : ''}{vehicle.country}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium mb-2">{vehicle.title}</h1>
                {vehicle.ticket_price && (
                  <p className="text-3xl md:text-4xl font-medium text-blue-600">
                    R{vehicle.ticket_price.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {vehicle.year && (
                  <div className="border border-foreground p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[11px] uppercase">Year</span>
                    </div>
                    <p className="font-medium">{vehicle.year}</p>
                  </div>
                )}
                {vehicle.mileage !== null && (
                  <div className="border border-foreground p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Gauge className="w-4 h-4" />
                      <span className="text-[11px] uppercase">Mileage</span>
                    </div>
                    <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                  </div>
                )}
                {vehicle.transmission && (
                  <div className="border border-foreground p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Settings2 className="w-4 h-4" />
                      <span className="text-[11px] uppercase">Transmission</span>
                    </div>
                    <p className="font-medium capitalize">{vehicle.transmission}</p>
                  </div>
                )}
                {vehicle.fuel_type && (
                  <div className="border border-foreground p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Fuel className="w-4 h-4" />
                      <span className="text-[11px] uppercase">Fuel Type</span>
                    </div>
                    <p className="font-medium capitalize">{vehicle.fuel_type}</p>
                  </div>
                )}
              </div>

              {/* Condition */}
              {vehicle.condition && (
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium capitalize">Condition: {vehicle.condition}</span>
                </div>
              )}

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-lg font-medium mb-3">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{vehicle.description}</p>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 mb-8">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Location</h3>
                  <p className="text-muted-foreground">{vehicle.address}</p>
                  <a 
                    href={`https://maps.google.com/maps?q=${encodeURIComponent(vehicle.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Get directions →
                  </a>
                </div>
              </div>

              {/* Source link for scraped vehicles */}
              {vehicle.is_scraped && vehicle.source_url && (
                <div className="border-t border-border pt-6">
                  <p className="text-sm text-muted-foreground">
                    This listing was sourced from{' '}
                    <a 
                      href={vehicle.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      original listing
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Right: Seller Info & Inquiry Form */}
            <div className="lg:sticky lg:top-24 self-start">
              {/* Seller Info */}
              <div className="border border-foreground p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">Seller Information</h2>
                <p className="text-muted-foreground mb-4">Listed by {vehicle.creator}</p>
                
                {vehicle.seller_phone && (
                  <a 
                    href={`tel:${vehicle.seller_phone}`}
                    className="flex items-center gap-3 p-3 border border-foreground hover:bg-muted transition-colors mb-3"
                  >
                    <Phone className="w-5 h-5" />
                    <span>{vehicle.seller_phone}</span>
                  </a>
                )}
                
                {vehicle.seller_email && (
                  <a 
                    href={`mailto:${vehicle.seller_email}?subject=Inquiry about ${vehicle.title}`}
                    className="flex items-center gap-3 p-3 border border-foreground hover:bg-muted transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>{vehicle.seller_email}</span>
                  </a>
                )}
              </div>

              {/* Inquiry Form */}
              <div className="border border-foreground p-6">
                <h2 className="text-lg font-medium mb-4">Send an Inquiry</h2>
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm border border-foreground focus:outline-none bg-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Your email *"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm border border-foreground focus:outline-none bg-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Your phone (optional)"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-foreground focus:outline-none bg-transparent"
                  />
                  <textarea
                    placeholder="Your message *"
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm border border-foreground focus:outline-none bg-transparent resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-foreground text-background font-medium uppercase text-sm hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-700 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default VehicleDetail;
