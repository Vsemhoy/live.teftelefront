import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import { useExpertStore } from '@/shared/expertStore';
import api from '@/shared/utils/api';
import { useProjectorStore } from '../store/projectorStore';

const unwrap = (response) => response.data?.content ?? response.data ?? [];

const projectPayload = (project) => ({
  title: project.title,
  code: project.code || null,
  color: project.color || null,
  description: project.description || null,
  result: project.result || null,
  priority_id: Number(project.priority_id || 13),
  status_id: Number(project.status_id || 20),
  started_on: project.started_on || null,
  due_at: project.due_at || null,
  closed_at: project.closed_at || null,
  is_pinned: Boolean(project.is_pinned),
  is_expert: Boolean(project.is_expert),
  is_hidden: Boolean(project.is_hidden),
  show_in_tasker: project.show_in_tasker !== false,
  sort_order: Number(project.sort_order || 0),
  meta: project.meta || null,
});

export const useProjects = (params = {}) => {
  const user = useAuthStore((state) => state.user);
  const expertMode = useExpertStore((state) => state.expertMode);
  const projectFilter = useProjectorStore((state) => state.projectFilter);
  const searchQuery = useProjectorStore((state) => state.searchQuery);
  const showHidden = useProjectorStore((state) => state.showHidden);

  const queryParams = {
    q: params.q ?? searchQuery,
    open_only: (params.filter ?? projectFilter) === 'open',
    include_expert: expertMode,
    include_hidden: params.include_hidden ?? showHidden,
    ...(params.tasker_visible ? { tasker_visible: 1 } : {}),
    limit: params.limit ?? 200,
  };

  return useQuery({
    queryKey: ['prj_projects', queryParams, expertMode],
    queryFn: () => api.get('/projector/projects', { params: queryParams }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 20 * 1000,
  });
};

export const useProject = (id, params = {}) => {
  const user = useAuthStore((state) => state.user);
  const expertMode = useExpertStore((state) => state.expertMode);

  return useQuery({
    queryKey: ['prj_project', id, params, expertMode],
    queryFn: () => api.get(`/projector/projects/${id}`, {
      params: { include_expert: expertMode, include_hidden: params.include_hidden ?? false },
    }).then(unwrap),
    enabled: Boolean(user && id),
    staleTime: 20 * 1000,
  });
};

export const useSaveProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project) => {
      const payload = projectPayload(project);
      if (project.id) return api.put(`/projector/projects/${project.id}`, payload).then(unwrap);
      return api.post('/projector/projects', payload).then(unwrap);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['prj_projects'] });
      if (saved?.id) queryClient.invalidateQueries({ queryKey: ['prj_project', saved.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project) => api.delete(`/projector/projects/${project.id}`).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prj_projects'] });
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
    },
  });
};
