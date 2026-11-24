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
  /**
   * When true, the processor is not ready to handle events yet (e.g. no API token).
   * All events in the current chunk are released back to the queue without incrementing
   * their retry counter, and no further processing is scheduled until {@link Queue.drain} is called.
   */
  pause?: boolean;
}

export interface Entry {
  /** Id of the entry */
  id: string;
  /** Timestamp when the event was first added to the queue */
  t: number;
}

interface RetryableEntry {
  /** Number of retries */
  r: number;
  /** The entry payload */
  e: Entry;
  /** Timestamp of the last attempt, the base for the retry backoff */
  a?: number;
}

export type Processor<T extends Entry> = (data: T[]) => Promise<ProcessorResult>;

function expBackoff(startTime: number, retries: number): number {
  if (retries > 0) {
    return startTime + (Math.random() + 2 ** retries) * 1000;
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
  } catch (_error) {}
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

  /** Processes the stored entries now, e.g. on load or once a token is set. */
  drain(): void {
    this._processNow(this._store.get());
  }

  append(entry: Entry): void {
    let entries = this._store.get();
    entries.push({ e: entry, r: 0 });
    // TODO: allow custom trim, so that clients can control which entries get dropped
    entries = entries.slice(-MAX_SIZE);
    this._setEntries(entries);
  }

  private async _processNow(entries: RetryableEntry[]) {
    if (!entries.length) {
      return;
    }
    const chunk: RetryableEntry[] = [];
    for (let i = entries.length - 1; i >= 0 && chunk.length < MAX_PROCESSING_SIZE; i--) {
      const retryableEntry = entries[i];
      const entry = retryableEntry?.e;
      if (
        entry &&
        !this._processing.has(entry.id) &&
        expBackoff(retryableEntry.a ?? entry.t, retryableEntry.r) <= Date.now()
      ) {
        chunk.push(retryableEntry);
        this._processing.add(entry.id);
      }
    }
    if (!chunk.length) {
      this._scheduleProcessing();
      return;
    }
    // Take the chunk out of the shared store while its requests are in flight. Otherwise another
    // tab, or the next page if this one unloads before the requests resolve, would send it again.
    this._store.set(this._store.get().filter((entry) => !this._processing.has(entry.e.id)));
    let r: ProcessorResult = { done: new Set(), retry: new Set() };
    try {
      r = await this._processor(chunk.map((entry) => entry.e as T));
    } catch (_error) {
      // Mark all as failed
      for (const entry of chunk) {
        r.done.add(entry.e.id);
      }
    }
    // Put back the entries that still have to be sent
    const requeued: RetryableEntry[] = [];
    for (const entry of chunk) {
      this._processing.delete(entry.e.id);
      if (r.pause) {
        requeued.push(entry);
      } else if (r.retry.has(entry.e.id)) {
        if (entry.r < MAX_RETRIES) {
          requeued.push({ e: entry.e, r: entry.r + 1, a: Date.now() });
        }
      } else if (!r.done.has(entry.e.id)) {
        requeued.push(entry);
      }
    }
    const newEntries = requeued.concat(this._store.get()).slice(-MAX_SIZE);
    if (r.pause) {
      // Processor is not ready — release chunk back to queue without retrying or scheduling.
      // Processing resumes only when drain() is called externally (e.g. once a token is set).
      this._store.set(newEntries);
      return;
    }
    this._setEntries(newEntries);
  }

  private _setEntries(entries: RetryableEntry[]): void {
    this._store.set(entries);
    if (!entries.length) {
      return;
    }
    // Send right away: a page that unloads would cancel a pending timer, and the request
    // itself survives navigation because the SDK sends it with `keepalive`.
    this._processNow(entries);
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
