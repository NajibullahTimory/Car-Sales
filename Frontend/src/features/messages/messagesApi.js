import { apiRequest } from '../../lib/api';

// messages
export const getMessages = () => apiRequest('/messages');
export const getUnreadMessages = () => apiRequest('/messages/unread');
export const sendMessage = (message) =>
  apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify(message),
  });
export const markMessageRead = (id) => apiRequest(`/messages/${id}/read`, { method: 'PATCH' });
