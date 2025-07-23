import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const api = axios.create({
 // baseURL: 'http://10.0.2.2:8000/api/',
  baseURL: 'https://matrical-technologies-arthomed-api.onrender.com',
  headers: {
    'Content-Type': 'multipart/form-data',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  request => {
  
    return request;
  },
  error => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  response => {
  
    return response;
  },
  error => {
    return Promise.reject(error);
  },
);

const ApiService = {
  async setToken(value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${value}`;
  },

  query(resource, params) {
    return api.get(resource, params);
  },

  get(resource, slug = '') {
    return api.get(resource + (slug ? '/' + slug : ''));
  },

  post(resource, params) {
    return api.post(resource, params);
  },

  patch(resource, params) {
    return api.patch(resource, params);
  },

  update(resource, slug, params) {
    return api.put(resource + '/' + slug, params);
  },

  put(resource, params) {
    return api.put(resource, params);
  },

  delete(resource, slug = '') {
    return api.delete(resource + (slug ? '/' + slug : ''));
  },
};

export default ApiService;
