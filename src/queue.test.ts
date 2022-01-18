import { Entry, ProcessorResult, Queue } from "./queue";

let processedEvents: Entry[] = [];
async function processor(chunk: Entry[]): Promise<ProcessorResult> {
  processedEvents.push(...chunk);
  const r: ProcessorResult = {
    done: new Set(),
    retry: new Set(),
  };
  for (const entry of chunk) {
    if (entry.id.includes("-done")) {
      r.done.add(entry.id);
    } else if (entry.id.includes("-retry")) {
      r.retry.add(entry.id);
    } else {
      console.error(`Unknown id ${entry.id}`);
    }
  }
  return r;
}

function expectEmptyQueue<T extends Entry>(q: Queue<T>): void {
  const qData = {
    store: (q as any)._store.get(),
    processing: (q as any)._processing,
    scheduled: (q as any)._scheduled,
  };
  expect(qData).toEqual({ store: [], processing: new Set(), scheduled: false });
}

function now(): number {
  return Date.now() / 1000;
}

async function flushPromises(timeMs?: number): Promise<void> {
  const p = new Promise((resolve) => setTimeout(() => resolve("done"), 0));
  jest.runAllTicks();
  if (timeMs) {
    jest.advanceTimersByTime(timeMs);
  } else {
    jest.runAllTimers();
  }
  await p;
}

beforeEach(() => {
  jest.useFakeTimers();
  processedEvents = [];
});

afterEach(() => {
  jest.useRealTimers();
  (new Queue<Entry>(processor) as any)._store.set([]);
});

test("high priority event triggers immediate processing", async () => {
  const q = new Queue(processor);
  const entry = { id: "id-1-done", t: now() };
  q.append(entry, { highPriority: true });
  expect(processedEvents).toEqual([entry]);

  await flushPromises();

  expectEmptyQueue(q);
});

test("low priority event triggers delayed processing", async () => {
  const q = new Queue(processor);
  const entry = { id: "id-1-done", t: now() };
  q.append(entry, { highPriority: false });
  await flushPromises(249);
  expect(processedEvents).toEqual([]);
  await flushPromises(1);
  expect(processedEvents).toEqual([entry]);

  await flushPromises();
  expectEmptyQueue(q);
});

test("retry entries", async () => {
  const q = new Queue(processor);
  const entry = { id: "id-2-retry", t: now() };
  q.append(entry, { highPriority: false });
  await flushPromises(250);
  expect(processedEvents).toEqual([entry]);

  await flushPromises(250);
  // At this point the exponential backoff should prevent retrying the entry
  expect(processedEvents).toEqual([entry]);

  await flushPromises(3500);
  expect(processedEvents).toEqual([entry, entry]);

  await flushPromises(15000);
  expect(processedEvents).toEqual([entry, entry, entry]);

  // After the third try, we should remove the entry from the queue.
  await flushPromises();
  expectEmptyQueue(q);
});

test("simultaneous entries", async () => {
  const q = new Queue(processor);
  const entry1 = { id: "id-1-done", t: now() };
  const entry2 = { id: "id-2-done", t: now() };
  const entry3 = { id: "id-3-done", t: now() };
  const entry4 = { id: "id-4-done", t: now() };
  const entry5 = { id: "id-5-done", t: now() };
  q.append(entry1, { highPriority: false });
  q.append(entry2, { highPriority: false });
  q.append(entry3, { highPriority: true });
  q.append(entry4, { highPriority: false });
  q.append(entry5, { highPriority: true });
  await flushPromises(250);
  // When we append the first priority, it forces the processing of all entries.
  // Subsequent ones will be considered priority ones, until the high priority
  // entry is resolved.
  expect(processedEvents).toEqual([entry3, entry2, entry1, entry4, entry5]);
  await flushPromises(250);
  expectEmptyQueue(q);
});
