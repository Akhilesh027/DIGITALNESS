import AsyncStorage from '@react-native-async-storage/async-storage';

// API calls
export const sendOtpToPhone = async (phone) => {
  // TODO: Call backend API to send OTP for real app
  // For now, simulate OTP send success with delay
  return new Promise(resolve => setTimeout(() => resolve(true), 1000));
};

export const registerStaff = async (details) => {
  const response = await fetch('https://beauty-backend-ci9o.onrender.com/api/staff/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  });
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
};

export const loginStaff = async (phone, otp) => {
  const response = await fetch('https://beauty-backend-ci9o.onrender.com/api/staff/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
};

export const saveAuthData = async (staffId, authToken) => {
  try {
    await AsyncStorage.setItem('staffId', staffId);
    await AsyncStorage.setItem('authToken', authToken);
  } catch (error) {
    console.error('Failed to save auth data', error);
  }
};

export const fetchStaffDetails = async () => {
  try {
    const staffId = await AsyncStorage.getItem('staffId');
    const response = await fetch(`https://beauty-backend-ci9o.onrender.com/api/staff/${staffId}`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  } catch (error) {
    throw error;
  }
};