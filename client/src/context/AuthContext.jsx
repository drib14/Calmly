import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api';
  axios.defaults.withCredentials = true;

  // Interceptor to attach token & handle refresh
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
        response => response,
        async (error) => {
            const originalRequest = error.config;
            // Only retry if 401 and we haven't retried yet AND it's not the refresh endpoint itself
            if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
                originalRequest._retry = true;
                try {
                    const res = await axios.get('/auth/refresh');
                    const { accessToken } = res.data;
                    localStorage.setItem('accessToken', accessToken);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                    return axios(originalRequest);
                } catch (refreshError) {
                    // If refresh fails (403/401), clear everything and redirect
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    setUser(null);
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );

    return () => {
        axios.interceptors.request.eject(requestInterceptor);
        axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Here we would ideally validate the token or fetch user profile
        // For simplicity, we assume token means logged in, but we need user data.
        // Let's assume we stored user data in localStorage too, or fetch it.
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { accessToken, ...userData } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (email, password, realName) => {
    try {
      const res = await axios.post('/auth/register', { email, password, realName });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
