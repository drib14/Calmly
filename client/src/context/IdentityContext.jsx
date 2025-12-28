import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const IdentityContext = createContext();

export const useIdentity = () => useContext(IdentityContext);

export const IdentityProvider = ({ children }) => {
  const { user } = useAuth();
  const [identities, setIdentities] = useState([]);
  const [currentIdentity, setCurrentIdentity] = useState(null);

  useEffect(() => {
    if (user) {
      fetchIdentities();
    } else {
      setIdentities([]);
      setCurrentIdentity(null);
    }
  }, [user]);

  const fetchIdentities = async () => {
    try {
      const res = await axios.get('/identities');
      setIdentities(res.data);
      // Always default to 'real' identity if not set, or first available
      if (res.data.length > 0) {
          const real = res.data.find(i => i.type === 'real');
          if (!currentIdentity) {
              setCurrentIdentity(real || res.data[0]);
          }
      }
    } catch (error) {
      console.error("Failed to fetch identities", error);
    }
  };

  const createPseudonym = async (name, bio) => {
    try {
      const res = await axios.post('/identities', { name, bio });
      setIdentities([...identities, res.data]);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  };

  const deleteIdentity = async (id) => {
      try {
          await axios.delete(`/identities/${id}`);
          setIdentities(identities.filter(i => i._id !== id));
          if (currentIdentity?._id === id) {
              const real = identities.find(i => i.type === 'real');
              setCurrentIdentity(real || null);
          }
          return { success: true };
      } catch (error) {
          return { success: false, message: error.response?.data?.message };
      }
  };

  const selectIdentity = (id) => {
    const identity = identities.find(i => i._id === id);
    if (identity) setCurrentIdentity(identity);
  };

  return (
    <IdentityContext.Provider value={{ identities, currentIdentity, selectIdentity, createPseudonym, deleteIdentity }}>
      {children}
    </IdentityContext.Provider>
  );
};
