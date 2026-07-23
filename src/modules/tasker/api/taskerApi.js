import { useEffect, useRef } from 'react';
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
  meta: task.meta || null,
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

const checklistItemPayload = (item) => ({
  task_id: item.task_id || item.parent_task_id,
  title: item.title,
  status_id: Number(item.status_id || 20),
  sort_order: Number(item.sort_order || 0),
  meta: item.meta || null,
});

const spanPayload = (span) => ({
  task_id: span.task_id,
  kind: span.kind || 'fact',
  title: span.title || null,
  content: span.content || null,
  planned_start_at: span.planned_start_at || null,
  planned_end_at: span.planned_end_at || null,
  started_at: span.started_at || null,
  ended_at: span.ended_at || null,
  auto_stop_at: span.auto_stop_at || null,
  auto_stopped_at: span.auto_stopped_at || null,
  auto_stop_reason: span.auto_stop_reason || null,
  sort_order: Number(span.sort_order || 0),
});

export const useTasks = (params = {}) => {
  const user = useAuthStore((state) => state.user);
  const expertMode = useExpertStore((state) => state.expertMode);
  const taskFilter = useTaskerStore((state) => state.taskFilter);
  const searchQuery = useTaskerStore((state) => state.searchQuery);
  const projectFilter = useTaskerStore((state) => state.projectFilter);
  const assigneeFilter = useTaskerStore((state) => state.assigneeFilter);
  const onlyBlocked = useTaskerStore((state) => state.onlyBlocked);
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

  const assigneeId = params.assignee_contact_id ?? assigneeFilter;
  if (assigneeId && assigneeId !== 'all') queryParams.assignee_contact_id = assigneeId;

  const blockedOnly = params.only_blocked ?? onlyBlocked;
  if (blockedOnly) queryParams.status_id = 23;

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

export const useTaskSpans = (params = {}) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['tsk_spans', params],
    queryFn: () => api.get('/tasker/spans', { params }).then(unwrap),
    enabled: Boolean(user),
    staleTime: 20 * 1000,
  });
};

export const useSaveTaskSpan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (span) => {
      const payload = spanPayload(span);
      if (span.id) return api.put(`/tasker/spans/${span.id}`, payload).then(unwrap);
      return api.post('/tasker/spans', payload).then(unwrap);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['tsk_spans'] });
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
      if (saved?.task_id) queryClient.invalidateQueries({ queryKey: ['tsk_task', saved.task_id] });
    },
  });
};

export const useDeleteTaskSpan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (span) => api.delete(`/tasker/spans/${span.id}`).then(unwrap),
    onSuccess: (_deleted, span) => {
      queryClient.invalidateQueries({ queryKey: ['tsk_spans'] });
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
      if (span?.task_id) queryClient.invalidateQueries({ queryKey: ['tsk_task', span.task_id] });
    },
  });
};

export const useCloseOverdueTaskSpans = () => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const checkedUserIdRef = useRef(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/tasker/spans/close-overdue').then(unwrap),
    onSuccess: (payload) => {
      if (!payload?.closed_count) return;
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tsk_task'] });
      queryClient.invalidateQueries({ queryKey: ['tsk_spans'] });
      queryClient.invalidateQueries({ queryKey: ['timer_active'] });
    },
  });

  useEffect(() => {
    if (!user?.id || checkedUserIdRef.current === user.id) return;
    checkedUserIdRef.current = user.id;
    mutation.mutate();
  }, [mutation, user?.id]);

  return mutation;
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

export const useSaveChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item) => {
      const payload = checklistItemPayload(item);
      if (item.id) return api.put(`/tasker/checklist-items/${item.id}`, payload).then(unwrap);
      return api.post('/tasker/checklist-items', payload).then(unwrap);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
      if (saved?.task_id) queryClient.invalidateQueries({ queryKey: ['tsk_task', saved.task_id] });
    },
  });
};

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item) => api.delete(`/tasker/checklist-items/${item.id}`).then(unwrap),
    onSuccess: (_deleted, item) => {
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
      if (item?.task_id || item?.parent_task_id) {
        queryClient.invalidateQueries({ queryKey: ['tsk_task', item.task_id || item.parent_task_id] });
      }
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

export const useDeleteTaskLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (log) => api.delete(`/tasker/logs/${log.id}`).then(unwrap),
    onSuccess: (_deleted, log) => {
      queryClient.invalidateQueries({ queryKey: ['tsk_logs'] });
      if (log?.task_id) queryClient.invalidateQueries({ queryKey: ['tsk_task', log.task_id] });
    },
  });
};

export const useBulkDeleteTaskLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => api.post('/tasker/logs/bulk-delete', payload).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tsk_logs'] });
      queryClient.invalidateQueries({ queryKey: ['tsk_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tsk_task'] });
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
