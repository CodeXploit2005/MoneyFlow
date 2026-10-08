import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { groupApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { Group } from '../types';

// Desktop and mobile share one request/cache, including when both are mounted.
export const useWorkspaceGroups = (enabled = true) => {
  const userId = useAuthStore(state => state.user?._id);
  const setGroups = useGroupStore(state => state.setGroups);
  const query = useQuery<Group[]>({
    queryKey: ['workspace-groups', userId],
    enabled: enabled && !!userId,
    queryFn: async () => {
      const groups: Group[] = (await groupApi.getMyGroups()).data || [];
      return Array.from(new Map(groups.map(group => [group._id, group])).values());
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 1
  });
  useEffect(() => {
    if (query.data && userId === useAuthStore.getState().user?._id) setGroups(query.data);
  }, [query.data, userId, setGroups]);
  return query;
};
