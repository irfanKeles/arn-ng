// Used in specs only: a hand-written `Storage` that can be told to throw.

export interface FakeStorage {
  readonly storage: Storage;
  readonly data: Map<string, string>;
  /** When `true`, `getItem` throws. */
  failReads: boolean;
  /** When `true`, `setItem` throws. */
  failWrites: boolean;
}

export function createFakeStorage(initial: Record<string, string> = {}): FakeStorage {
  const data = new Map(Object.entries(initial));
  const fake: FakeStorage = {
    data,
    failReads: false,
    failWrites: false,
    storage: {
      get length() {
        return data.size;
      },
      clear: () => {
        data.clear();
      },
      key: (index: number) => [...data.keys()][index] ?? null,
      removeItem: (key: string) => {
        data.delete(key);
      },
      getItem: (key: string) => {
        if (fake.failReads) {
          throw new Error('getItem failed');
        }

        return data.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (fake.failWrites) {
          throw new Error('setItem failed');
        }

        data.set(key, value);
      },
    },
  };

  return fake;
}
