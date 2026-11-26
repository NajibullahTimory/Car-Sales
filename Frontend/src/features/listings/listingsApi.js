import { apiRequest } from '../../lib/api';

export const searchListings = (filters) => apiRequest(`/listings?${filters}`);
export const getListing = (id) => apiRequest(`/listings/${id}`);
export const getMyListings = () => apiRequest('/listings/mine');
export const getFavorites = () => apiRequest('/favorites');
export const createListing = (listing) =>
  apiRequest('/listings', {
    method: 'POST',
    body: JSON.stringify(listing),
  });
export const updateListing = (id, listing) =>
  apiRequest(`/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(listing),
  });
export const deleteListing = (id) =>
  apiRequest(`/listings/${id}`, {
    method: 'DELETE',
  });
export const setFavorite = (id, saved) =>
  apiRequest(`/favorites/${id}`, {
    method: saved ? 'PUT' : 'DELETE',
  });
