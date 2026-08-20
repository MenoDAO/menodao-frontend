import '@testing-library/jest-dom';

const store = new Map<string, string>();
const localStorageMock = {
  get length() {
    return store.size;
  },
  key: jest.fn((index: number) => Array.from(store.keys())[index] ?? null),
  getItem: jest.fn((key: string) => store.get(key) ?? null),
  setItem: jest.fn((key: string, value: string) => {
    store.set(key, String(value));
  }),
  removeItem: jest.fn((key: string) => {
    store.delete(key);
  }),
  clear: jest.fn(() => {
    store.clear();
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

global.fetch = jest.fn();

beforeEach(() => {
  store.clear();
  localStorageMock.getItem.mockImplementation((key: string) => store.get(key) ?? null);
  localStorageMock.setItem.mockImplementation((key: string, value: string) => {
    store.set(key, String(value));
  });
  localStorageMock.removeItem.mockImplementation((key: string) => {
    store.delete(key);
  });
  localStorageMock.clear.mockImplementation(() => {
    store.clear();
  });
  (global.fetch as jest.Mock).mockReset();
});
