import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import arrowDown from '@/assets/arrow-down.png';
import { SEOHead } from '@/components/SEOHead';
import { EventsCarousel } from '@/components/EventsCarousel';
import { RotatingBadge } from '@/components/RotatingBadge';
import { VehicleSearch } from '@/components/VehicleSearch';
import { LocationFilter } from '@/components/LocationFilter';
import { VEHICLE_BRANDS, VehicleBrand } from '@/constants/eventCategories';

interface Vehicle {
  id: string;
  title: string;
  date: string;
  time: string;
  background_image_url: string;
  target_date: string;
  address: string;
  category: string;
  country: string | null;
  city: string | null;
  ticket_url: string | null;
  ticket_price: number | null;
  year: number | null;
  mileage: number | null;
}

const VehicleCard = ({
  vehicle
}: {
  vehicle: Vehicle;
}) => {
  const navigate = useNavigate();
  
  const isNewlyListed = () => {
    const now = new Date().getTime();
    const listed = new Date(vehicle.target_date).getTime();
    const threeDays = 1000 * 60 * 60 * 24 * 3;
    return now - listed <= threeDays;
  };
  
  const isNew = isNewlyListed();
  const brandInfo = VEHICLE_BRANDS.find(c => c.value === vehicle.category);
  
  return (
    <div 
      className="relative cursor-pointer group"
      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
    >
      <div className="overflow-hidden mb-3">
        <div 
          className="aspect-square bg-muted bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
          style={{ backgroundImage: `url(${vehicle.background_image_url})` }}
        ></div>
      </div>
      <div className="absolute top-4 left-4 flex flex-col gap-0">
        {vehicle.ticket_price && (
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 border border-blue-700 px-3 h-[23px] flex items-center text-white">
            <div className="text-[11px] font-medium uppercase leading-none">
              R{vehicle.ticket_price.toLocaleString()}
            </div>
          </div>
        )}
        {brandInfo && (
          <div className="bg-background border border-t-0 border-foreground px-3 h-[23px] flex items-center gap-1">
            <span className="text-[11px]">{brandInfo.emoji}</span>
            <div className="text-[11px] font-medium uppercase leading-none">{brandInfo.label}</div>
          </div>
        )}
        {vehicle.year && (
          <div className="bg-background border border-t-0 border-foreground px-3 h-[23px] flex items-center">
            <div className="text-[11px] font-medium uppercase leading-none">{vehicle.year}</div>
          </div>
        )}
        {isNew && (
          <div className="bg-[#4ADE80] border border-t-0 border-foreground px-3 h-[23px] flex items-center">
            <div className="text-[11px] font-medium uppercase leading-none">NEW</div>
          </div>
        )}
      </div>
      {vehicle.mileage && (
        <div className="absolute top-4 right-4">
          <div className="bg-background border border-foreground px-2 h-[23px] flex items-center">
            <div className="text-[11px] font-medium leading-none">
              {(vehicle.mileage / 1000).toFixed(0)}k km
            </div>
          </div>
        </div>
      )}
      <h3 className="text-lg font-medium line-clamp-1">{vehicle.title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{vehicle.address}</p>
    </div>
  );
};

const Discover = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('South Africa');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([null, null]);
  const [yearRange, setYearRange] = useState<[number | null, number | null]>([null, null]);
  const [mileageMax, setMileageMax] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
    detectUserCountry();
  }, []);

  const detectUserCountry = async () => {
    try {
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const data = await response.text();
      const locMatch = data.match(/loc=([A-Z]{2})/);
      
      if (locMatch && locMatch[1]) {
        const countryCode = locMatch[1];
        const countryNames: { [key: string]: string } = {
          'ZA': 'South Africa', 'NG': 'Nigeria', 'GH': 'Ghana', 'KE': 'Kenya',
          'BW': 'Botswana', 'TZ': 'Tanzania', 'UG': 'Uganda', 'RW': 'Rwanda',
          'ET': 'Ethiopia', 'SN': 'Senegal', 'CI': 'Côte d\'Ivoire', 'MA': 'Morocco',
          'EG': 'Egypt', 'MU': 'Mauritius', 'ZM': 'Zambia', 'ZW': 'Zimbabwe',
          'NA': 'Namibia', 'MZ': 'Mozambique', 'AO': 'Angola', 'CM': 'Cameroon'
        };
        setUserCountry(countryNames[countryCode] || 'South Africa');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error detecting country:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time, background_image_url, target_date, address, category, country, city, ticket_url, ticket_price, year, mileage')
        .order('target_date', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        vehicle.title.toLowerCase().includes(query) ||
        vehicle.address.toLowerCase().includes(query) ||
        (vehicle.category && vehicle.category.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Brand filter
    if (selectedBrand && vehicle.category !== selectedBrand) return false;
    
    // Price range filter
    if (priceRange[0] && (vehicle.ticket_price === null || vehicle.ticket_price < priceRange[0])) return false;
    if (priceRange[1] && (vehicle.ticket_price === null || vehicle.ticket_price > priceRange[1])) return false;
    
    // Year range filter
    if (yearRange[0] && (vehicle.year === null || vehicle.year < yearRange[0])) return false;
    if (yearRange[1] && (vehicle.year === null || vehicle.year > yearRange[1])) return false;
    
    // Mileage filter
    if (mileageMax && (vehicle.mileage === null || vehicle.mileage > mileageMax)) return false;
    
    // Country filter
    if (selectedCountry && vehicle.country !== selectedCountry) return false;
    
    // City filter
    if (selectedCity && vehicle.city !== selectedCity) return false;
    
    return true;
  });

  const scrollToListings = () => {
    const listingsSection = document.getElementById('listings-section');
    listingsSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBrand(null);
    setPriceRange([null, null]);
    setYearRange([null, null]);
    setMileageMax(null);
    setSelectedCountry(null);
    setSelectedCity(null);
  };

  const hasActiveFilters = searchQuery || selectedBrand || priceRange[0] || priceRange[1] || yearRange[0] || yearRange[1] || mileageMax || selectedCountry || selectedCity;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Peer-to-Peer Dealership & Car Rentals | Workhorse"
        description="Workhorse is an online, peer-to-peer dealership for quality pre-owned vehicles and a car rentals agency where anyone can make an offer or request to rent/lease directly from the owner."
        keywords="used cars, pre-owned vehicles, car rentals, lease cars, peer-to-peer dealership, South Africa, buy cars, sell cars, Toyota, BMW, Mercedes, Volkswagen"
      />
      <div className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <Navbar />
      </div>
      
      <RotatingBadge 
        text="BROWSE" 
        onClick={scrollToListings}
        showIcon={true}
        icon={<img src={arrowDown} alt="Arrow down" className="w-6 h-6 md:w-7 md:h-7 lg:w-12 lg:h-12" />}
      />
      
      {/* Hero Section */}
      <section className="pt-32 md:pt-40 lg:pt-48 pb-6 md:pb-16 lg:pb-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium mb-6 md:mb-10 inline-flex flex-col items-center" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="flex items-center">
              <span className="border border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>Find your</span>
              <span className="bg-[#ff6bff] border border-foreground px-3 md:px-6 py-2 md:py-4 rounded-[20px] md:rounded-[40px] -ml-px animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>next ride</span>
            </div>
            <div className="flex items-center -mt-px">
              <span className="border border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>peer to</span>
              <span className="border border-l-0 border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>peer</span>
            </div>
          </h1>
          <p className="text-sm md:text-base lg:text-[18px] text-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
            Workhorse is an online, peer-to-peer dealership for quality pre-owned vehicles and a car rentals agency where anyone can make an offer or request to rent/lease directly from the owner.
          </p>
        </div>
      </section>

      <EventsCarousel />

      {/* Listings Section */}
      <section id="listings-section" className="px-4 md:px-8 pb-16 pt-6 md:pt-16">
        <div>
          {/* Search & Filters */}
          <div className="mb-6 md:mb-8 animate-fade-in space-y-4" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
            <VehicleSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedBrand={selectedBrand}
              onBrandChange={setSelectedBrand}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              yearRange={yearRange}
              onYearRangeChange={setYearRange}
              mileageMax={mileageMax}
              onMileageMaxChange={setMileageMax}
            />

            {/* Location Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Location:</span>
              <LocationFilter
                selectedCountry={selectedCountry}
                selectedCity={selectedCity}
                onCountryChange={setSelectedCountry}
                onCityChange={setSelectedCity}
              />
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
                {selectedCountry && ` in ${selectedCountry}`}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-[11px] font-medium uppercase border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {loading ? (
              <div className="col-span-full text-center py-12">Loading vehicles...</div>
            ) : filteredVehicles.length === 0 ? (
              <div className="col-span-full text-center py-12">
                {hasActiveFilters ? (
                  <div>
                    <p className="mb-4">No vehicles found matching your filters</p>
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 text-sm font-medium uppercase border border-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  'No vehicles listed yet. Be the first to list yours!'
                )}
              </div>
            ) : (
              filteredVehicles.map((vehicle, index) => (
                <div 
                  key={vehicle.id} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${0.1 + (index * 0.05)}s`, animationFillMode: 'both' }}
                >
                  <VehicleCard vehicle={vehicle} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Discover;
