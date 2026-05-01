import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/utils/api';
import {
  MOCK_BOOKS, MOCK_DOCUMENTS, MOCK_BLOCKS,
} from './bookerMocks';

const USE_MOCKS = true; // переключить на false когда бэк готов

// ── Книги ─────────────────────────────────────────────────────────

export const useBooks = (params = {}) =>
  useQuery({
    queryKey: ['books', params],
    queryFn: async () => {
      if (USE_MOCKS) {
        let books = [...MOCK_BOOKS];
        if (params.my)    books = books.filter((b) => b.user_id === 'user-1');
        if (params.tag)   books = books.filter((b) => b.tags?.includes(params.tag));
        if (params.q)     books = books.filter((b) => b.title.toLowerCase().includes(params.q.toLowerCase()));
        return books;
      }
      const { data } = await api.get('/booker/books', { params });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useBook = (id) =>
  useQuery({
    queryKey: ['books', id],
    queryFn: async () => {
      if (USE_MOCKS) return MOCK_BOOKS.find((b) => b.id === id) ?? null;
      const { data } = await api.get(`/booker/books/${id}`);
      return data;
    },
    enabled: !!id,
  });

export const useSaveBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (book) => {
      if (USE_MOCKS) return { ...book, id: book.id || `book-${Date.now()}` };
      const { data } = book.id
        ? await api.put(`/booker/books/${book.id}`, book)
        : await api.post('/booker/books', book);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });
};

export const useDeleteBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (USE_MOCKS) return;
      await api.delete(`/booker/books/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
  });
};

// ── Документы ─────────────────────────────────────────────────────

export const useDocuments = (bookId) =>
  useQuery({
    queryKey: ['documents', bookId],
    queryFn: async () => {
      if (USE_MOCKS) return MOCK_DOCUMENTS[bookId] ?? [];
      const { data } = await api.get(`/booker/books/${bookId}/documents`);
      return data;
    },
    enabled: !!bookId,
  });

export const useSaveDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc) => {
      if (USE_MOCKS) return { ...doc, id: doc.id || `doc-${Date.now()}` };
      const { data } = doc.id
        ? await api.put(`/booker/documents/${doc.id}`, doc)
        : await api.post(`/booker/books/${doc.book_id}/documents`, doc);
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['documents', vars.book_id] }),
  });
};

export const useReorderDocuments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookId, order }) => {
      if (USE_MOCKS) return;
      await api.post(`/booker/books/${bookId}/documents/reorder`, { order });
    },
    onSuccess: (_, { bookId }) => qc.invalidateQueries({ queryKey: ['documents', bookId] }),
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bookId }) => {
      if (USE_MOCKS) return;
      await api.delete(`/booker/documents/${id}`);
    },
    onSuccess: (_, { bookId }) => qc.invalidateQueries({ queryKey: ['documents', bookId] }),
  });
};

// ── Блоки ─────────────────────────────────────────────────────────

export const useBlocks = (documentId) =>
  useQuery({
    queryKey: ['blocks', documentId],
    queryFn: async () => {
      if (USE_MOCKS) return MOCK_BLOCKS[documentId] ?? [];
      const { data } = await api.get(`/booker/documents/${documentId}/blocks`);
      return data;
    },
    enabled: !!documentId,
  });

export const useSaveBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (block) => {
      if (USE_MOCKS) return { ...block, id: block.id || `block-${Date.now()}` };
      const { data } = block.id
        ? await api.put(`/booker/blocks/${block.id}`, block)
        : await api.post(`/booker/documents/${block.document_id}/blocks`, block);
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['blocks', vars.document_id] }),
  });
};

export const useDeleteBlock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, documentId }) => {
      if (USE_MOCKS) return;
      await api.delete(`/booker/blocks/${id}`);
    },
    onSuccess: (_, { documentId }) => qc.invalidateQueries({ queryKey: ['blocks', documentId] }),
  });
};

export const useReorderBlocks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, order }) => {
      if (USE_MOCKS) return;
      await api.post(`/booker/documents/${documentId}/blocks/reorder`, { order });
    },
    onSuccess: (_, { documentId }) => qc.invalidateQueries({ queryKey: ['blocks', documentId] }),
  });
};

// ── Публичный блок ────────────────────────────────────────────────

export const usePublicBlock = (id) =>
  useQuery({
    queryKey: ['public-block', id],
    queryFn: async () => {
      if (USE_MOCKS) {
        const allBlocks = Object.values(MOCK_BLOCKS).flat();
        return allBlocks.find((b) => b.id === id) ?? null;
      }
      const { data } = await api.get(`/opn/booker/b/${id}`);
      return data;
    },
    enabled: !!id,
  });
