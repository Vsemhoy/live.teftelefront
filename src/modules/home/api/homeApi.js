import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import api from '@/shared/utils/api';

export const useHomeFeed = ({ filter } = {}) => {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['home_feed', filter],
    queryFn: () => api
      .get('/feed', { params: { filter, limit: 30 } })
      .then((response) => response.data.data),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  });
};
