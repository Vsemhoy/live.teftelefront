import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/authStore';
import { useExpertStore } from '@/shared/expertStore';
import api from '@/shared/utils/api';
import { useTaskerStore } from '../store/taskerStore';

const unwrap = (response) => response.data?.content ?? response.data ?? [];

const taskPayload = (task) => ({
  title: task.title,
  description: task.description || null,
  result: task.result || null,
  assignee_contact_id: task.assignee_contact_id || null,
  priority_id: Number(task.priority_id || 13),
  status_id: Number(task.status_id || 20),
  due_at: task.due_at || null,
  eventor_event_id: task.eventor_event_id || null,
  parent_task_id: task.parent_task_id || null,
  project_id: task.project_id || null,
  tracked_seconds: Number(task.tracked_seconds || 0),
  sort_order: Number(task.sort_order || 0),
  is_pinned: Boolean(task.is_pinned),
  is_expert: Boolean(task.is_expert),
  is_hidden: Boolean(task.is_hidden),
  closed_at: task.closed_at || null,
});

const logPayload = (log) => ({
  task_id: log.task_id,
  kind: log.kind || 'note',
  content: log.content || null,
  blocker_id: log.blocker_id || null,
  timer_entry_id: log.timer_entry_id || null,
  occurred_at: log.occurred_at || null,
  meta: log.meta || null,
});

export const useTasks = (params = {}) => {
  const user = useAuthStore((state) => state.user);
  const expertMode = useExpertStore((state) => state.expertMode);
  const taskFilter = useTaskerStore((state) => state.taskFilter);
  const searchQuery = useTaskerStore((state) => state.searchQuery);
  const projectFilter = useTaskerStore((state) => state.projectFilter);
  const showHidden = useTaskerStore((state) => state.showHidden);

  const queryParams = {
    q: params.q ?? searchQuery,
    open_only: (params.filter ?? taskFilter) === 'open',
    include_expert: expertMode,
    include_hidden: params.include_hidden ?? showHidden,
    limit: params.limit ?? 200,
  };

  const projectId = params.project_id ?? projectFilter;
  if (projectId && projectId !== 'all') queryParams.project_id = projectId;

  return useQuery({
    queryKey: ['tsk_tasks', queryParams, expertMode],
    queryFn: () => api.get('/tasker/tasks', { params: queryParams }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 20 * 1000,
  });
};

export const useTask = (id, params = {}) => {
  const user = useAuthStore((state) => state.user);
  const expertMode = useExpertStore((state) => state.expertMode);

  return useQuery({
    queryKey: ['tsk_task', id, params, expertMode],
    queryFn: () => api.get(`/tasker/tasks/${id}`, {
      params: { include_expert: expertMode, include_hidden: params.include_hidden ?? false },
    }).then(unwrap),
    enabled: Boolean(user && id),
    staleTime: 20 * 1000,
  });
};

export const useTaskLogs = (params = {}) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['tsk_logs', params],
    queryFn: () => api.get('/tasker/logs', { params }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 20 * 1000,
  });
};

export const useBlockers = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['tsk_blockers'],
    queryFn: () => api.get('/tasker/blockers').then(unwrap),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
  });
};

export const useSaveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task) => {
      const payload = taskPayload(task);
      if (task.id) return api.put(`/tasker/tasks/${task.id}`, payload).then(unwrap);
      return api.post('/tasker/tasks', payload).then(unwrap);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['prj_projects'] });
      if (saved?.id) queryClient.invalidateQueries({ queryKey: ['tsk_task', saved.id] });
      if (saved?.parent_task_id) queryClient.invalidateQueries({ queryKey: ['tsk_task', saved.parent_task_id] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task) => api.delete(`/tasker/tasks/${task.id}`).then(unwrap),
    onSuccess: (_deleted, task) => {
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['prj_projects'] });
      if (task?.parent_task_id) queryClient.invalidateQueries({ queryKey: ['tsk_task', task.parent_task_id] });
    },
  });
};

export const useSaveTaskLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (log) => {
      const payload = logPayload(log);
      if (log.id) return api.put(`/tasker/logs/${log.id}`, payload).then(unwrap);
      return api.post('/tasker/logs', payload).then(unwrap);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['tsk_logs'] });
      if (saved?.task_id) queryClient.invalidateQueries({ queryKey: ['tsk_task', saved.task_id] });
    },
  });
};

export const useSaveBlocker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blocker) => {
      const payload = {
        title: blocker.title,
        description: blocker.description || null,
        occurrence_count: Number(blocker.occurrence_count || 0),
      };
      if (blocker.id) return api.put(`/tasker/blockers/${blocker.id}`, payload).then(unwrap);
      return api.post('/tasker/blockers', payload).then(unwrap);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tsk_blockers'] }),
  });
};
