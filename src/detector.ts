import { TopsortEvent } from "./events";
import { ProcessorResult, Queue } from "./queue";
import { reportEvent } from "./reporter";

const MAX_EVENTS_SIZE = 2500;
let seenEvents = new Set<string>();

/**
 * Generate an id.
 *
 * In modern browsers this will be a UUID, otherwise if createObjectUrl is not available it will
 * just be a random number;
 */
function generateId(): string {
  return (
    window.URL.createObjectURL?.(new Blob()).split("/").pop() ||
    Math.random() + ""
  );
}

let globalUserId: string | undefined;

function getUserId(): string {
  if (globalUserId) {
    return globalUserId;
  }
  const userId = getUserIdCookie();
  if (userId) {
    globalUserId = userId;
    return userId;
  }
  const newUserId = generateId();
  setUserIdCookie(newUserId);
  return newUserId;
}

function setUserIdCookie(id: string): void {
  const cookieName = window.TS.cookieName || "tsuid";
  globalUserId = id;
  document.cookie = cookieName + "=" + id + ";max-age=31536000";
}

function resetUserId(): string {
  globalUserId = undefined;
  document.cookie = "tsuid=";
  return getUserId();
}

window.TS.setUserId = setUserIdCookie;
window.TS.getUserId = getUserId;
window.TS.resetUserId = resetUserId;

// Based on https://stackoverflow.com/a/25490531/1413687
function getUserIdCookie(): string | undefined {
  const cookieName = window.TS.cookieName || "tsuid";
  const regex = new RegExp("/(^|;)\\s*" + cookieName + "\\s*=\\s*([^;]+)/");
  return regex.exec(document.cookie)?.pop();
}

function getApiPayload(event: ProductEvent): TopsortEvent {
  const eventType = event.type;
  const session = { sessionId: event.uid };
  const placement = {
    page: event.page,
  };
  const t = new Date(event.t * 1000).toISOString();
  switch (eventType) {
    case "click":
      return {
        eventType,
        session,
        id: event.id,
        productId: event.product,
        auctionId: event.auction,
        placement,
        occurredAt: t,
      };
    case "impression":
      return {
        eventType,
        session,
        occurredAt: t,
        impressions: [
          {
            id: event.id,
            productId: event.product,
            auctionId: event.auction,
            placement,
          },
        ],
      };
    case "purchase":
      return {
        eventType,
        session,
        id: event.id,
        purchasedAt: t,
        items: (event.items || []).map((e) => ({
          productId: e.product,
          quantity: e.quantity,
          unitPrice: e.price,
        })),
      };
  }
}

// TODO: batch requests. Unfortunately at the moment only the impressions are batchable.
async function processor(data: ProductEvent[]): Promise<ProcessorResult> {
  const r: ProcessorResult = {
    done: new Set(),
    retry: new Set(),
  };
  const promises = [];
  for (const entry of data) {
    promises.push(
      reportEvent(getApiPayload(entry), window.TS)
        .then((result) => {
          const q = result.retry ? r.retry : r.done;
          q.add(entry.id);
        })
        .catch(() => {
          r.done.add(entry.id);
        })
    );
  }
  await Promise.all(promises);
  return r;
}

const queue = new Queue(processor);

export type EventType = "click" | "purchase" | "impression";

interface Purchase {
  product: string;
  quantity: number;
  price: number;
}

interface ProductEvent {
  type: EventType;
  product: string;
  auction?: string;
  t: number;
  page: string;
  id: string;
  uid: string;
  items?: Purchase[];
}

function logEvent(info: ProductEvent, node: Node) {
  const id = getId(info);
  if (seenEvents.has(id)) {
    return;
  }
  seenEvents.add(id);
  if (seenEvents.size > MAX_EVENTS_SIZE) {
    const iterator = seenEvents.values();
    for (let i = 0; i < seenEvents.size - MAX_EVENTS_SIZE; --i) {
      iterator.next();
    }
    seenEvents = new Set(iterator);
  }
  queue.append(info);

  // Raise a custom event, so that clients can trigger their own logic.
  // One concrete use of this is for testing purposes.
  const event = new CustomEvent("topsort", { bubbles: true, detail: info });
  node.dispatchEvent(event);
}

function getId(event: ProductEvent): string {
  return [event.page, event.type, event.product, event.auction].join("-");
}

function getPage(): string {
  const location = window.location;
  const hash = location.hash;
  // This is to support HashRouter from either ReactRouter or VueRouter.
  if (hash[1] === "/") return hash;
  return location.pathname;
}

function getEvent(type: EventType, node: unknown): ProductEvent {
  const product = (node as HTMLElement)?.dataset.tsProduct || "";
  const auction = (node as HTMLElement)?.dataset.tsAuction;
  const event: ProductEvent = {
    type,
    product,
    auction,
    t: Date.now() / 1000,
    page: getPage(),
    id: generateId(),
    uid: getUserId(),
  };
  if (type === "purchase") {
    event.items = JSON.parse((node as HTMLElement)?.dataset.tsItems || "[]");
  }
  return event;
}

function interactionHandler(event: Event): void {
  const t = event.currentTarget as any;
  logEvent(getEvent("click", t), t);
}

const PRODUCT_SELECTOR =
  "[data-ts-product],[data--ts-auction],[data-ts-action],[data-ts-items]";

function checkChildren(node: Element | Document) {
  const matchedNodes = node.querySelectorAll(PRODUCT_SELECTOR);
  for (let i = 0; i < matchedNodes.length; i++) {
    const node = matchedNodes[i];
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (node.dataset.tsProduct) {
      logEvent(getEvent("impression", node), node);
      node.addEventListener("click", interactionHandler);
    } else {
      logEvent(getEvent("purchase", node), node);
    }
  }
}

function mutationCallback(mutationsList: MutationRecord[]) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      // Here we could just do a mutation.target.querySelectorAll, but that could also bring the
      // nodes we have already seen before. Instead we just check the added nodes.
      const newParents = new Set<HTMLElement>();
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const newNode = mutation.addedNodes[i];
        if (newNode.nodeType === Node.ELEMENT_NODE) {
          const parent = newNode.parentElement;
          if (parent && !newParents.has(parent)) {
            newParents.add(parent);
          }
        }
        for (const node of newParents) {
          checkChildren(node);
        }
      }
    } else if (mutation.type === "attributes") {
      if ((mutation.target as any).dataset.tsProduct) {
        logEvent(getEvent("impression", mutation.target), mutation.target);
        mutation.target.addEventListener("click", interactionHandler);
      } else {
        logEvent(getEvent("purchase", mutation.target), mutation.target);
      }
    }
  }
}

function start() {
  if (!window.TS?.token) {
    console.error("Missing TS token");
    return;
  }
  checkChildren(document);
  const MutationObserverImpl =
    window.MutationObserver ||
    window.WebKitMutationObserver ||
    window.MozMutationObserver;
  const mutationObserver = new MutationObserverImpl(mutationCallback);
  mutationObserver.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: [
      "data-ts-product",
      "data-ts-auction",
      "data-ts-action",
      "data-ts-items",
    ],
  });
}

if (/complete|interactive|loaded/.test(document.readyState)) {
  start();
} else {
  window.addEventListener("DOMContentLoaded", start);
}
