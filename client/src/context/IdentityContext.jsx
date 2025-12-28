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
      if (res.data.length > 0 && !currentIdentity) {
        setCurrentIdentity(res.data[0]); // Default to first (usually Real)
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

  const selectIdentity = (id) => {
    const identity = identities.find(i => i._id === id);
    if (identity) setCurrentIdentity(identity);
  };

  return (
    <IdentityContext.Provider value={{ identities, currentIdentity, selectIdentity, createPseudonym }}>
      {children}
    </IdentityContext.Provider>
  );
};
