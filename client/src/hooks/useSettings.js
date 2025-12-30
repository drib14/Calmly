import useSWR from 'swr';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const fetcher = url => axios.get(url).then(res => res.data);

export const useSettings = () => {
  const { user } = useAuth();

  const { data: settings, error, mutate } = useSWR(user ? '/settings' : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 min
  });

  return {
    settings: settings || {},
    isLoading: user && !settings && !error,
    isError: error,
    mutate
  };
};
