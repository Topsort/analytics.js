export interface Store<T> {
  get(): T[];
  set(value: T[]): void;
}

export class MemoryStore<T> implements Store<T> {
  private _data: T[];
  constructor() {
    this._data = [];
  }
  get(): T[] {
    return this._data;
  }
  set(data: T[]): void {
    this._data = data;
  }
}

export class LocalStorageStore<T> implements Store<T> {
  private _key: string;
  private _storage: Storage;
  constructor(key: string) {
    this._key = key;
    this._storage = window.localStorage;
  }
  get(): T[] {
    const data = this._storage.getItem(this._key);
    return data ? JSON.parse(data) : [];
  }
  set(data: T[]): void {
    this._storage.setItem(this._key, JSON.stringify(data));
  }
}
