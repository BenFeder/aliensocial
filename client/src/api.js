import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Set default config
axios.defaults.baseURL = API_URL;

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
  unconnect: (userId) => axios.delete(`/users/connect/${userId}`)
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
  })
};

export { setAuthToken };
export default axios;
