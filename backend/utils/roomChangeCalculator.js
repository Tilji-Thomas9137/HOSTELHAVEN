/**
 * Calculate remaining months in the academic year
 * Academic year typically runs from June to May (12 months)
 * Or can be configured based on institution
 */
export const calculateRemainingMonths = (academicYearStartMonth = 6) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // Calculate academic year start date
  let academicYearStart = new Date(currentYear, academicYearStartMonth - 1, 1);
  
  // If current month is before academic year start, use previous year's start
  if (currentMonth < academicYearStartMonth) {
    academicYearStart = new Date(currentYear - 1, academicYearStartMonth - 1, 1);
  }
  
  // Calculate academic year end (12 months from start)
  const academicYearEnd = new Date(academicYearStart);
  academicYearEnd.setMonth(academicYearEnd.getMonth() + 12);
  
  // Calculate months remaining
  const monthsElapsed = Math.max(0, (now - academicYearStart) / (1000 * 60 * 60 * 24 * 30.44));
  const monthsRemaining = Math.max(0, 12 - Math.ceil(monthsElapsed));
  
  return Math.min(12, Math.max(1, Math.round(monthsRemaining)));
};

/**
 * Calculate price difference for room change
 * @param {number} currentRoomPrice - Yearly price of current room
 * @param {number} requestedRoomPrice - Yearly price of requested room
 * @param {number} remainingMonths - Remaining months in academic year
 * @returns {object} Price difference details
 */
export const calculateRoomChangePrice = (currentRoomPrice, requestedRoomPrice, remainingMonths = null) => {
  if (remainingMonths === null) {
    remainingMonths = calculateRemainingMonths();
  }
  
  const yearlyDifference = requestedRoomPrice - currentRoomPrice;
  const monthlyCurrentPrice = currentRoomPrice / 12;
  const monthlyRequestedPrice = requestedRoomPrice / 12;
  
  // For upgrade: student pays difference for remaining months
  // For downgrade: credit goes to wallet for remaining months
  const priceDifference = yearlyDifference;
  const remainingMonthsDifference = (monthlyRequestedPrice - monthlyCurrentPrice) * remainingMonths;
  
  return {
    yearlyDifference,
    remainingMonthsDifference,
    monthlyCurrentPrice,
    monthlyRequestedPrice,
    remainingMonths,
    isUpgrade: yearlyDifference > 0,
    isDowngrade: yearlyDifference < 0,
    upgradePaymentRequired: yearlyDifference > 0 ? remainingMonthsDifference : 0,
    downgradeWalletCredit: yearlyDifference < 0 ? Math.abs(remainingMonthsDifference) : 0,
  };
};

