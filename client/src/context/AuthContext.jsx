import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }

      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          window.location.href = '/login';
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    axios.get('/api/auth/me')
      .then((response) => {
        if (!cancelled) {
          setUser(response.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
  };

  const signup = async (email, password, fullName) => {
    const response = await axios.post('/api/auth/signup', { email, password, fullName });
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const generateInvite = async (role) => {
    const response = await axios.post('/api/auth/invite', { role });
    return response.data.inviteToken;
  };

  const joinFamily = async (inviteToken, email, password, fullName) => {
    const response = await axios.post('/api/auth/join', {
      inviteToken, email, password, fullName,
    });
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
  };

  return (
    <AuthContext.Provider
      value={{
        token, user, loading, login, signup, logout, generateInvite, joinFamily,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
