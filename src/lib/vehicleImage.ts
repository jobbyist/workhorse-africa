import { VEHICLE_BRANDS } from '@/constants/eventCategories';
import vehiclePlaceholder from '@/assets/vehicle-placeholder.svg';

type VehicleImageInput = {
  background_image_url?: string | null;
  category?: string | null;
};

const matchesDifferentBrand = (imageUrl: string, category: string | null | undefined) => {
  if (!category) return false;
  const matchedBrand = VEHICLE_BRANDS.find((brand) => {
    const normalizedLabel = brand.label.toLowerCase();
    return imageUrl.includes(brand.value) || imageUrl.includes(normalizedLabel);
  });

  return Boolean(matchedBrand && matchedBrand.value !== category);
};

export const VEHICLE_PLACEHOLDER_IMAGE = vehiclePlaceholder;

export const getVehicleImageUrl = (vehicle: VehicleImageInput) => {
  const normalizedUrl = (vehicle.background_image_url ?? '').toLowerCase();
  if (!normalizedUrl) {
    return vehiclePlaceholder;
  }

  if (matchesDifferentBrand(normalizedUrl, vehicle.category)) {
    return vehiclePlaceholder;
  }

  return vehicle.background_image_url ?? vehiclePlaceholder;
};
