/**
 * Amenities Pricing Configuration
 * Base prices are per year
 * Additional charges are added to base price based on selected amenities
 */

export const BASE_ROOM_PRICES = {
  Single: 30000,   // ₹30,000 per year (most expensive)
  Double: 24000,   // ₹24,000 per year (per person)
  Triple: 18000,   // ₹18,000 per year (per person)
  Quad: 15000,     // ₹15,000 per year (per person)
};

export const AMENITY_PRICES = {
  ac: 12000,                    // ₹12,000 per year
  attachedBathroom: 8000,       // ₹8,000 per year
  geyser: 5000,                 // ₹5,000 per year
  wifi: 3000,                   // ₹3,000 per year
  extraFurniture: 4000,         // ₹4,000 per year
  fan: 2000,                    // ₹2,000 per year per fan
};

/**
 * Calculate total room price based on room type and selected amenities
 * @param {String} roomType - Single, Double, Triple, or Quad
 * @param {Object} amenities - Object with amenity flags and counts
 * @returns {Object} - { basePrice, amenitiesPrice, totalPrice }
 */
export const calculateRoomPrice = (roomType, amenities = {}) => {
  // Get base price for room type
  const basePrice = BASE_ROOM_PRICES[roomType] || 0;

  // Calculate amenities price
  let amenitiesPrice = 0;

  if (amenities.ac) {
    amenitiesPrice += AMENITY_PRICES.ac;
  }
  if (amenities.attachedBathroom) {
    amenitiesPrice += AMENITY_PRICES.attachedBathroom;
  }
  if (amenities.geyser) {
    amenitiesPrice += AMENITY_PRICES.geyser;
  }
  if (amenities.wifi) {
    amenitiesPrice += AMENITY_PRICES.wifi;
  }
  if (amenities.extraFurniture) {
    amenitiesPrice += AMENITY_PRICES.extraFurniture;
  }
  if (amenities.fanCount && amenities.fanCount > 0) {
    amenitiesPrice += AMENITY_PRICES.fan * amenities.fanCount;
  }

  const totalPrice = basePrice + amenitiesPrice;

  return {
    basePrice,
    amenitiesPrice,
    totalPrice,
  };
};

/**
 * Get amenity price breakdown for display
 */
export const getAmenityPriceBreakdown = (amenities = {}) => {
  const breakdown = [];

  if (amenities.ac) {
    breakdown.push({ name: 'AC', price: AMENITY_PRICES.ac });
  }
  if (amenities.attachedBathroom) {
    breakdown.push({ name: 'Attached Bathroom', price: AMENITY_PRICES.attachedBathroom });
  }
  if (amenities.geyser) {
    breakdown.push({ name: 'Geyser', price: AMENITY_PRICES.geyser });
  }
  if (amenities.wifi) {
    breakdown.push({ name: 'Wi-Fi', price: AMENITY_PRICES.wifi });
  }
  if (amenities.extraFurniture) {
    breakdown.push({ name: 'Extra Furniture', price: AMENITY_PRICES.extraFurniture });
  }
  if (amenities.fanCount && amenities.fanCount > 0) {
    breakdown.push({ 
      name: `Fan (${amenities.fanCount}x)`, 
      price: AMENITY_PRICES.fan * amenities.fanCount 
    });
  }

  return breakdown;
};

