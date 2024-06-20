import { LocalStorageStore, MemoryStore, type Store } from "./store";

const STORAGE_TEST_KEY = "ts-t";
const STORAGE_KEY = "ts-q";
const MAX_SIZE = 250;
const MAX_RETRIES = 3;
const MAX_PROCESSING_SIZE = 25;
const WAIT_TIME_MS = 250;

export interface ProcessorResult {
  done: Set<string>;
  retry: Set<string>;
}

export interface Entry {
  /** Id of the entry */
  id: string;
  /** Timestamp when the event was first added to the queue */
  t: number;
}

const PRIORITY_MAX = 9;
const PRIORITY_MIN = 0;

interface RetryableEntry {
  /** Number of retries */
  r: number;
  /** The entry payload */
  e: Entry;
  /**
   * The entry's priority
   *
   * See {@link PRIORITY_MIN} and {@link PRIORITY_MAX} */
  p: number;
}

export type Processor<T extends Entry> = (data: T[]) => Promise<ProcessorResult>;

function expBackoff(startTime: number, retries: number): number {
  if (retries > 0) {
    return startTime + (Math.random() + Math.pow(2, retries)) * 1000;
  }
  // This could be just startTime, but we chose to return 0, just to ensure
  // that the event is always added the first time. Even if the clock changed.
  return 0;
}

/**
 * Probes the different store implementations looking for one that works in the current browser.
 *
 * To do so, it checks {@link LocalStorageStore} is actually functional by adding a dummy object and
 * checking the retrieved result is the same.
 *
 * Note: there's nothing special about the id, but it need to be ideally a length one string, in
 * order to minimize the JS library size.
 */
function getStore(): Store<RetryableEntry> {
  const localStore = new LocalStorageStore<{ x: string }>(STORAGE_TEST_KEY);
  try {
    const id = "3";
    localStore.set([{ x: id }]);
    const r = localStore.get();
    if (r[0]?.x === id) {
      return new LocalStorageStore<RetryableEntry>(STORAGE_KEY);
    }
  } catch (error) {}
  return new MemoryStore<RetryableEntry>();
}

export class Queue<T extends Entry> {
  private _store: Store<RetryableEntry>;
  private _processing: Set<string>;
  private _processor: Processor<T>;
  private _scheduled: boolean;

  constructor(processor: Processor<T>) {
    this._store = getStore();
    this._processing = new Set<string>();
    this._scheduled = false;
    this._processor = processor;
  }

  append(entry: Entry, opts?: { highPriority: boolean }): void {
    let entries = this._store.get();
    entries.push({
      e: entry,
      r: 0,
      p: opts?.highPriority ? PRIORITY_MAX : PRIORITY_MIN,
    });
    // TODO: allow custom trim, so that clients can control which entries get dropped
    entries = entries.slice(-MAX_SIZE);
    this._setEntries(entries);
  }

  private async _processNow(entries: RetryableEntry[]) {
    if (!entries.length) {
      return;
    }
    const chunk: T[] = [];
    for (let i = entries.length - 1; i >= 0 && chunk.length < MAX_PROCESSING_SIZE; i--) {
      const retryableEntry = entries[i];
      const entry = retryableEntry?.e;
      if (
        entry &&
        !this._processing.has(entry.id) &&
        expBackoff(entry.t, retryableEntry.r) <= Date.now()
      ) {
        chunk.push(entry as T);
        this._processing.add(entry.id);
      }
    }
    if (!chunk.length) {
      this._scheduleProcessing();
      return;
    }
    let r: ProcessorResult = { done: new Set(), retry: new Set() };
    try {
      r = await this._processor(chunk);
    } catch (error) {
      // Mark all as failed
      for (const entry of chunk) {
        r.done.add(entry.id);
      }
    }
    // Remove entries from processing
    const newProcessing: string[] = [];
    for (const entryId of this._processing) {
      if (!chunk.find((e) => e.id === entryId)) {
        newProcessing.push(entryId);
      }
    }
    this._processing = new Set(newProcessing);
    // Modify entries
    const oldEntries = this._store.get();
    const newEntries: RetryableEntry[] = [];
    for (const entry of oldEntries) {
      if (r.done.has(entry.e.id)) {
        // do nothing
      } else if (r.retry.has(entry.e.id)) {
        if (entry.r < MAX_RETRIES) {
          entry.r += 1;
          newEntries.push(entry);
        }
      } else {
        newEntries.push(entry);
      }
    }
    this._setEntries(newEntries);
  }

  private _setEntries(entries: RetryableEntry[]): void {
    this._store.set(entries);
    if (!entries.length) {
      return;
    }
    if (entries.some((e) => e.p === PRIORITY_MAX) || this._store instanceof MemoryStore) {
      this._processNow(entries);
    } else {
      this._scheduleProcessing();
    }
  }

  private _scheduleProcessing(): void {
    if (this._scheduled) return;
    this._scheduled = true;

    setTimeout(() => {
      this._scheduled = false;
      this._processNow(this._store.get());
    }, WAIT_TIME_MS);
  }
}
