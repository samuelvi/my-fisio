type HydraCollection<T> = {
  member?: T[];
  'hydra:member'?: T[];
};

export function extractCollection<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const collection = payload as HydraCollection<T>;

  if (Array.isArray(collection['hydra:member'])) {
    return collection['hydra:member'];
  }

  if (Array.isArray(collection.member)) {
    return collection.member;
  }

  return [];
}
