// lib/validators.js - INPUT VALIDATION

// Email validation
export const isValidEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return regex.test(email);
};

// Phone validation (India)
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone);
};

// Price validation
export const isValidPrice = (price, min = 0, max = 50000) => {
  if (typeof price !== 'number') return false;
  if (isNaN(price)) return false;
  if (price < min || price > max) return false;
  return true;
};

// Distance validation
export const isValidDistance = (distance, max = 1000) => {
  if (typeof distance !== 'number') return false;
  if (isNaN(distance)) return false;
  if (distance < 0 || distance > max) return false;
  return true;
};

// Coordinates validation
export const isValidCoordinates = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
};

// Vehicle type validation
export const isValidVehicleType = (type) => {
  const validTypes = ['bike', 'auto', 'sedan', 'suv', 'luxury', 'tempo'];
  return validTypes.includes(type?.toLowerCase());
};

// Payment method validation
export const isValidPaymentMethod = (method) => {
  const validMethods = ['cash', 'upi', 'card', 'wallet'];
  return validMethods.includes(method?.toLowerCase());
};

// OTP validation
export const isValidOTP = (otp) => {
  if (!otp) return false;
  const regex = /^\d{6}$/;
  return regex.test(otp);
};

// Name validation
export const isValidName = (name) => {
  if (!name) return false;
  if (name.length < 2 || name.length > 100) return false;
  const regex = /^[a-zA-Z\s\u0900-\u097F]+$/;
  return regex.test(name);
};

// Booking request validation
export const validateBookingRequest = (data) => {
  const errors = [];
  
  if (!isValidName(data.name)) {
    errors.push('Invalid full name');
  }
  
  if (!isValidPhone(data.phone)) {
    errors.push('Invalid phone number (must be 10 digits starting with 6-9)');
  }
  
  if (!isValidVehicleType(data.vehicleType)) {
    errors.push('Invalid vehicle type');
  }
  
  if (!isValidCoordinates(data.pickupLat, data.pickupLng)) {
    errors.push('Invalid pickup coordinates');
  }
  
  if (!isValidCoordinates(data.dropLat, data.dropLng)) {
    errors.push('Invalid drop coordinates');
  }
  
  if (!isValidDistance(data.distance)) {
    errors.push('Invalid distance');
  }
  
  if (!isValidPaymentMethod(data.paymentMethod)) {
    errors.push('Invalid payment method');
  }
  
  return { valid: errors.length === 0, errors };
};

// Driver registration validation
export const validateDriverRegistration = (data) => {
  const errors = [];
  
  if (!isValidName(data.full_name)) {
    errors.push('Invalid full name');
  }
  
  if (!isValidPhone(data.phone)) {
    errors.push('Invalid phone number');
  }
  
  if (!isValidEmail(data.email)) {
    errors.push('Invalid email address');
  }
  
  if (!data.vehicle_number || data.vehicle_number.length < 5) {
    errors.push('Invalid vehicle number');
  }
  
  if (!data.license_number || data.license_number.length < 5) {
    errors.push('Invalid license number');
  }
  
  if (data.password && data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return { valid: errors.length === 0, errors };
};

export default {
  isValidEmail,
  isValidPhone,
  isValidPrice,
  isValidDistance,
  isValidCoordinates,
  isValidVehicleType,
  isValidPaymentMethod,
  isValidOTP,
  isValidName,
  validateBookingRequest,
  validateDriverRegistration
};