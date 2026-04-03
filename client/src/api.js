import axios from 'axios';

// In production (Vercel), API is on same domain. In development, use localhost
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5001/api' : '/api');

console.log('API URL:', API_URL);

// Set default config
axios.defaults.baseURL = API_URL;

// Add response interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Add token to requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize token from localStorage
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Auth API
export const authAPI = {
  register: (data) => axios.post('/users/register', data),
  login: (data) => axios.post('/users/login', data),
  getCurrentUser: () => axios.get('/users/me'),
  getUserByUsername: (username) => axios.get(`/users/${username}`),
  updateProfile: (data) => axios.put('/users/profile', data),
  uploadAvatar: (formData) => axios.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  connect: (userId) => axios.post(`/users/connect/${userId}`),
  acceptConnection: (userId) => axios.post(`/users/connect/${userId}/accept`),
  rejectConnection: (userId) => axios.delete(`/users/connect/${userId}/reject`),
  unconnect: (userId) => axios.delete(`/users/connect/${userId}`),
  searchUsers: (query) => axios.get('/users/search/users', { params: { q: query } }),
  changePassword: (data) => axios.put('/users/change-password', data)
};

// Posts API
export const postsAPI = {
  createPost: (formData) => axios.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFeed: () => axios.get('/posts/feed'),
  getUserPosts: (username) => axios.get(`/posts/user/${username}`),
  getPost: (id) => axios.get(`/posts/${id}`),
  updatePost: (id, data) => axios.put(`/posts/${id}`, data),
  deletePost: (id) => axios.delete(`/posts/${id}`),
  sharePost: (id, content) => axios.post(`/posts/${id}/share`, { content }),
  likePost: (id) => axios.post(`/posts/${id}/like`)
};

// Comments API
export const commentsAPI = {
  createComment: (data) => axios.post('/comments', data),
  updateComment: (id, data) => axios.put(`/comments/${id}`, data),
  deleteComment: (id) => axios.delete(`/comments/${id}`),
  getPostComments: (postId) => axios.get(`/comments/post/${postId}`)
};

// Pages API
export const pagesAPI = {
  createPage: (data) => axios.post('/pages', data),
  getPages: (userId) => axios.get('/pages', { params: { userId } }),
  getPage: (id) => axios.get(`/pages/${id}`),
  updatePage: (id, data) => axios.put(`/pages/${id}`, data),
  deletePage: (id) => axios.delete(`/pages/${id}`),
  followPage: (id) => axios.post(`/pages/${id}/follow`),
  unfollowPage: (id) => axios.delete(`/pages/${id}/follow`),
  uploadPageAvatar: (id, formData) => axios.post(`/pages/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  searchPages: (query) => axios.get('/pages/search/pages', { params: { q: query } }),
  getPagePosts: (id) => axios.get(`/pages/${id}/posts`)
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () => axios.get('/notifications'),
  getCount: () => axios.get('/notifications/count'),
  markAsRead: (id) => axios.put(`/notifications/${id}/read`),
  markAllAsRead: () => axios.put('/notifications/read-all'),
  deleteNotification: (id) => axios.delete(`/notifications/${id}`)
};

// Messages API
export const messagesAPI = {
  getConversations: () => axios.get('/messages/conversations'),
  getMessages: (userId) => axios.get(`/messages/${userId}`),
  sendMessage: (data) => axios.post('/messages', data),
  deleteMessage: (id) => axios.delete(`/messages/${id}`)
};

// Helper function to get the correct image URL
// If the URL is already absolute (Cloudinary), return as-is
// If it's a relative path (local storage), prepend the base URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If the path is already a full URL (starts with http:// or https://), return it as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, prepend the API base URL (without /api suffix)
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}${imagePath}`;
};

export { setAuthToken };
export default axios;
