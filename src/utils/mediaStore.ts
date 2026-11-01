import { EducationMedia, INITIAL_EDUCATION_MEDIA } from '../types/media';

const MEDIA_STORAGE_KEY = 'panthai_ayhos_education_media_v1';

let inMemoryMedia: EducationMedia[] = [...INITIAL_EDUCATION_MEDIA];

export function loadLocalMedia(): EducationMedia[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return inMemoryMedia;
  }
  try {
    const raw = window.localStorage.getItem(MEDIA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryMedia = parsed;
        return inMemoryMedia;
      }
    }
    // Seed initial media
    window.localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(INITIAL_EDUCATION_MEDIA));
  } catch (err) {
    console.warn('LocalStorage media read error:', err);
  }
  return inMemoryMedia;
}

export function saveLocalMedia(list: EducationMedia[]): void {
  inMemoryMedia = list;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('LocalStorage media save error:', err);
    }
  }
}

export const MediaStore = {
  getAll: (): EducationMedia[] => {
    return loadLocalMedia();
  },

  getById: (id: string): EducationMedia | undefined => {
    const list = loadLocalMedia();
    return list.find((m) => m.id === id);
  },

  add: (data: {
    title: string;
    category: EducationMedia['category'];
    categoryLabel: string;
    mediaType: EducationMedia['mediaType'];
    url: string;
    thumbnailUrl?: string;
    description: string;
    durationOrPages?: string;
    author: string;
    tags?: string[];
  }): EducationMedia => {
    const list = loadLocalMedia();
    const newMedia: EducationMedia = {
      ...data,
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newMedia, ...list];
    saveLocalMedia(updated);
    return newMedia;
  },

  update: (id: string, updates: Partial<EducationMedia>): EducationMedia | null => {
    const list = loadLocalMedia();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    const updatedMedia = { ...list[idx], ...updates };
    const updatedList = [...list];
    updatedList[idx] = updatedMedia;
    saveLocalMedia(updatedList);
    return updatedMedia;
  },

  delete: (id: string): boolean => {
    const list = loadLocalMedia();
    const filtered = list.filter((m) => m.id !== id);
    if (filtered.length === list.length) return false;
    saveLocalMedia(filtered);
    return true;
  },
};
