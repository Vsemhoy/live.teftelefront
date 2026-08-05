import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/utils/api';

export const createBookerBook = async (book) => {
  const { data } = await api.post('/booker/books', book);
  return data;
};

export const createBookerPage = async (page) => {
  const { data } = await api.post('/booker/pages', page);
  return data;
};

export const createBookerBlockGroup = async (payload) => {
  const { data } = await api.post('/booker/block-groups', payload);
  return data;
};

// Books

export const useBooks = (params = {}, options = {}) =>
  useQuery({
    queryKey: ['bkr-books', params],
    queryFn: async () => {
      const { data } = await api.get('/booker/books', { params });
      return data;
    },
    staleTime: 5 * 60_000,
    ...options,
  });

export const useBook = (id) =>
  useQuery({
    queryKey: ['bkr-books', id],
    queryFn: async () => {
      const { data } = await api.get(`/booker/books/${id}`);
      return data;
    },
    enabled: !!id,
  });

export const useSaveBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (book) => {
      const { data } = book.id
        ? await api.put(`/booker/books/${book.id}`, book)
        : await api.post('/booker/books', book);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bkr-books'] }),
  });
};

export const useDeleteBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { await api.delete(`/booker/books/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bkr-books'] }),
  });
};

// Pages

export const usePages = (bookId, options = {}) =>
  useQuery({
    queryKey: ['bkr-pages', bookId],
    queryFn: async () => {
      const { data } = await api.get('/booker/pages', { params: { book_id: bookId } });
      return data;
    },
    enabled: !!bookId,
    ...options,
  });

export const usePage = (id) =>
  useQuery({
    queryKey: ['bkr-page', id],
    queryFn: async () => {
      const { data } = await api.get(`/booker/pages/${id}`);
      return data;
    },
    enabled: !!id,
  });

export const useSavePage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page) => {
      const { data } = page.id
        ? await api.put(`/booker/pages/${page.id}`, page)
        : await api.post('/booker/pages', page);
      return data;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['bkr-pages', result.book_id] });
      qc.invalidateQueries({ queryKey: ['bkr-books', result.book_id] });
      qc.invalidateQueries({ queryKey: ['bkr-page', result.id] });
    },
  });
};

export const useDeletePage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => { await api.delete(`/booker/pages/${id}`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bkr-pages'] });
      qc.invalidateQueries({ queryKey: ['bkr-books'] });
    },
  });
};

export const useReorderPages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items }) => {
      await api.post('/booker/pages/reorder', { items });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bkr-pages'] }),
  });
};

// Block groups

export const useCreateBlockGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/booker/block-groups', payload);
      return data;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['bkr-page', result.page_id] });
    },
  });
};

export const useUpdateBlockGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/booker/block-groups/${id}`, payload);
      return data;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['bkr-page', result.page_id] });
    },
  });
};

export const useDeleteBlockGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pageId }) => {
      await api.delete(`/booker/block-groups/${id}`);
      return { pageId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['bkr-page', result.pageId] });
    },
  });
};

export const useReorderBlocks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items }) => {
      await api.post('/booker/block-groups/reorder', { items });
    },
  });
};

// Block versions

export const useSaveBlockContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, pageId, content, payload, title, status }) => {
      const body = {};
      if (content !== undefined) body.content = content;
      if (payload !== undefined) body.payload = payload;
      if (title !== undefined) body.title = title;
      if (status !== undefined) body.status = status;
      body.make_master = true;
      const { data } = await api.post(`/booker/block-groups/${groupId}/versions`, body);
      return { ...data, pageId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['bkr-page', result.pageId] });
    },
  });
};

export const useBlockVersions = (groupId, options = {}) =>
  useQuery({
    queryKey: ['bkr-versions', groupId],
    queryFn: async () => {
      const { data } = await api.get(`/booker/block-groups/${groupId}/versions`);
      return data;
    },
    enabled: !!groupId,
    ...options,
  });

export const usePublishVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, blockId }) => {
      const { data } = await api.post(`/booker/block-groups/${groupId}/publish/${blockId}`);
      return data;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['bkr-page', result.page_id] });
    },
  });
};
