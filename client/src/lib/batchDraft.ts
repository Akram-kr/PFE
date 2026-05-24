export interface BatchDraftStudent {
  wallet: string;
  studentName: string;
  matricule: string;
  department: string;
  graduationYear: number;
  totalCredits: number;
  pfeNote: number;
}

const STORAGE_KEY = "diplochain-batch-drafts";

type BatchDraftStore = Record<string, BatchDraftStudent[]>;

function readDraftStore(): BatchDraftStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as BatchDraftStore;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function saveBatchDraft(
  batchId: bigint | number | string,
  students: BatchDraftStudent[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  const key = batchId.toString();
  const store = readDraftStore();

  store[key] = students;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getBatchDraft(
  batchId: bigint | number | string,
): BatchDraftStudent[] {
  if (typeof window === "undefined") {
    return [];
  }

  const store = readDraftStore();
  return store[batchId.toString()] ?? [];
}
