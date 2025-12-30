import useSWR from 'swr';
import axios from 'axios';

const fetcher = url => axios.get(url).then(res => res.data);

export const useSettings = () => {
  const { data: settings, error, mutate } = useSWR('/settings', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 min
  });

  return {
    settings: settings || {},
    isLoading: !settings && !error,
    isError: error,
    mutate
  };
};
