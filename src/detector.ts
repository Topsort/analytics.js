import { TopsortEvent } from "./events";
import { ProcessorResult, Queue } from "./queue";
import { reportEvent } from "./reporter";

const MAX_EVENTS_SIZE = 2500;
let seenEvents: string[] = [];

/**
 * Hack to get a uuid.
 *
 * Note: in case the createObjectUrl is not available it will default to a
 * random number;
 */
function uuid(): string {
  return (
    window.URL.createObjectURL?.(new Blob()).split("/").pop() ||
    Math.random() + ""
  );
}

function getUserId(): string {
  const userId = getUserIdCookie();
  if (userId) {
    return userId;
  }
  const newUserId = uuid();
  setUserIdCookie(newUserId);
  return newUserId;
}

function setUserIdCookie(value: string): void {
  document.cookie = "tsuid=" + value + ";max-age=31536000";
}

// Based on https://stackoverflow.com/a/25490531/1413687
function getUserIdCookie(): string | undefined {
  return /(^|;)\s*tsuid\s*=\s*([^;]+)/.exec(document.cookie)?.pop() || "";
}

function getApiPayload(event: ProductEvent): TopsortEvent {
  const eventType = event.type;
  const session = { sessionId: event.uid };
  const placement = {
    page: event.page,
  };
  if (eventType === "click") {
    return {
      eventType,
      session,
      id: event.id,
      productId: event.sku,
      auctionId: event.auction,
      placement,
    };
  } else if (eventType === "impression") {
    return {
      eventType,
      session,
      impressions: [
        {
          id: event.id,
          productId: event.sku,
          auctionId: event.auction,
          placement,
        },
      ],
    };
  } else {
    return {
      eventType,
      session,
      id: event.id,
      purchasedAt: new Date(event.t * 1000).toISOString(),
      // TODO: is this needed?
      items: (event.items || []).map((e) => ({
        productId: e.sku,
        quantity: e.quantity,
        unitPrice: e.price,
      })),
    };
  }
}

// TODO: batch requests. Unfortunately at the moment only the impressions are batchable.
async function processor(data: ProductEvent[]): Promise<ProcessorResult> {
  const r: ProcessorResult = {
    done: [],
    retry: [],
  };
  const promises = [];
  for (const entry of data) {
    promises.push(
      reportEvent(getApiPayload(entry), (window as any).TS)
        .then((result) => {
          const q = result.retry ? r.retry : r.done;
          q.push(entry.id);
        })
        .catch(() => {
          r.done.push(entry.id);
        })
    );
  }
  await Promise.all(promises);
  return r;
}

const queue = new Queue(processor);

// todo: implement purchase events

export type EventType = "click" | "purchase" | "impression";

interface Purchase {
  sku: string;
  quantity: number;
  price: number;
}

export interface ProductEvent {
  type: EventType;
  sku: string;
  auction: string | undefined;
  t: number;
  page: string;
  id: string;
  uid: string;
  items?: Purchase[];
}

function logEvent(info: ProductEvent, node: Node) {
  const id = getId(info);
  if (seenEvents.indexOf(id) !== -1) {
    return;
  }
  seenEvents.push(id);
  seenEvents = seenEvents.slice(-MAX_EVENTS_SIZE);
  queue.append(info);

  // Raise a custom event, so that clients can trigger their own logic.
  // One conrete use of this if for testing purposes.
  const event = new CustomEvent("topsort", { bubbles: true, detail: info });
  node.dispatchEvent(event);
}

function getId(event: ProductEvent): string {
  return [event.page, event.type, event.sku, event.auction].join("-");
}

// TODO: move somewhere else and test
function parseSkuAuction(skuAuction: string): [string, string | undefined] {
  const [sku, auction] = skuAuction.split(":");
  return [sku, auction && auction.length === 36 ? auction : undefined];
}

function getPage(): string {
  const location = window.location;
  const hash = location.hash;
  // This is to support HashRouter from either ReactRouter or VueRouter.
  if (hash[1] === "/") return hash;
  return location.pathname;
}

function getEvent(type: EventType, node: unknown): ProductEvent {
  const skuAuction = (node as HTMLElement)?.dataset.sku || "";
  const [sku, auction] = parseSkuAuction(skuAuction);
  const event: ProductEvent = {
    type,
    sku,
    auction,
    t: Date.now() / 1000,
    page: getPage(),
    id: uuid(),
    uid: getUserId(),
  };
  if (type === "purchase") {
    event.items = JSON.parse((node as HTMLElement)?.dataset.items || "[]");
  }
  return event;
}

function interactionHandler(event: Event): void {
  const t = event.currentTarget as any;
  logEvent(getEvent("click", t), t);
}

const PRODUCT_SELECTOR = "[data-sku],[data-action],[data-items]";

function checkChildren(node: Element | Document) {
  const matchedNodes = node.querySelectorAll(PRODUCT_SELECTOR);
  for (let i = 0; i < matchedNodes.length; i++) {
    const node = matchedNodes[i];
    if ((node as any).dataset.sku) {
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
      const newParents: HTMLElement[] = [];
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const newNode = mutation.addedNodes[i];
        if (newNode.nodeType === Node.ELEMENT_NODE) {
          const parent = newNode.parentElement;
          if (parent && newParents.indexOf(parent) === -1) {
            newParents.push(parent);
          }
        }
        for (const node of newParents) {
          checkChildren(node as any);
        }
      }
    } else if (mutation.type === "attributes") {
      if ((mutation.target as any).dataset.sku) {
        logEvent(getEvent("impression", mutation.target), mutation.target);
        mutation.target.addEventListener("click", interactionHandler);
      } else {
        logEvent(getEvent("purchase", mutation.target), mutation.target);
      }
    }
  }
}

function start() {
  if (!(window as any).TS.token) {
    console.error("Missing TS token");
    return;
  }
  checkChildren(document);
  const MutationObserverImpl =
    window.MutationObserver ||
    (window as any).WebKitMutationObserver ||
    (window as any).MozMutationObserver;
  const mutationObserver = new MutationObserverImpl(mutationCallback);
  mutationObserver.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ["data-sku", "data-action", "data-items"],
  });
}

if (/complete|interactive|loaded/.test(document.readyState)) {
  start();
} else {
  window.addEventListener("DOMContentLoaded", start);
}
