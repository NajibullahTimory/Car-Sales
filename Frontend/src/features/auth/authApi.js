// اطلاعات لاگین پیج ما را به سرور میفرستد
import { apiRequest } from '../../lib/api';

export const login = (credentials) =>
  apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const register = (profile) =>
  apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(profile),
  });

export const getCurrentUser = () => apiRequest('/auth/me');
export const updateProfile = (profile) =>
  apiRequest('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  });
