import Dexie from 'dexie';

// База браузера для черновиков — намеренно без user_id
// Черновики видны даже когда разлогинен
const db = new Dexie('teftele_drafts');

db.version(1).stores({
  // Индексы: localId (PK), syncStatus, created_at
  drafts: 'localId, syncStatus, created_at',
});

// ---- Helpers ----

/**
 * Создать черновик (вызывается когда нет сети или не залогинен)
 * @param {object} data — поля события без user_id
 * @returns {string} localId нового черновика
 */
export const createDraft = async (data) => {
  const localId = crypto.randomUUID();
  await db.drafts.add({
    localId,
    name: data.name || '',
    content: data.content || '',
    occurred_at: data.occurred_at || new Date().toISOString(),
    section_id: data.section_id || null,
    type_id: data.type_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    syncStatus: 'pending', // 'pending' | 'synced' | 'error'
    errorMsg: null,
  });
  return localId;
};

/**
 * Обновить черновик
 */
export const updateDraft = async (localId, data) => {
  await db.drafts.update(localId, {
    ...data,
    updated_at: new Date().toISOString(),
  });
};

/**
 * Удалить черновик (после успешного sync)
 */
export const deleteDraft = async (localId) => {
  await db.drafts.delete(localId);
};

/**
 * Получить все черновики со статусом pending/error
 */
export const getPendingDrafts = () => {
  return db.drafts
    .where('syncStatus')
    .anyOf(['pending', 'error'])
    .reverse()
    .sortBy('created_at');
};

/**
 * Отметить черновик как ошибочный
 */
export const markDraftError = async (localId, errorMsg) => {
  await db.drafts.update(localId, {
    syncStatus: 'error',
    errorMsg,
    updated_at: new Date().toISOString(),
  });
};

export default db;
