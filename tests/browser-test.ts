const errors: any[] = [];
function errorHandler(error: any) {
  errors.push(error);
}

window.addEventListener("error", errorHandler);
window.addEventListener("unhandledrejection", errorHandler);

const eventsCount: Record<string, number> = {};
function recordEvent(event: any) {
  const d = event.detail;
  const k = `${d.type}-${d.product}`;
  // @ts-ignore
  eventsCount[k] = eventsCount[k] === undefined ? 1 : eventsCount[k] + 1;
}
window.addEventListener("topsort", recordEvent);

interface Purchase {
  productId?: string;
  quantity?: number;
  unitPrice?: number;
}

interface Placement {
  path: string;
}

interface Entity {
  type: "product";
  id: string;
}

interface Impression {
  placement?: Placement;
  productId?: string;
  resolvedBidId?: string;
  id?: string;
}

interface ProductEvent {
  eventType?: string;
  placement?: Placement;
  entity?: Entity;
  resolvedBidId?: string | null;
  impressions?: Impression[];
  items?: Purchase[];
}

function match(event: any, productEvent: ProductEvent): boolean {
  for (const [key, val] of Object.entries(productEvent)) {
    if (Array.isArray(val)) {
      if (!event[key].every((v: any, i: number) => match(v, val[i]))) {
        return false;
      }
    } else if (typeof val === "object") {
      if (!match(event[key], val)) {
        return false;
      }
    } else if (val !== event[key]) {
      return false;
    }
  }
  return true;
}

async function checkEventExists(
  productId: string,
  eventType: string,
  event: ProductEvent,
): Promise<boolean> {
  const testId = window.testId;
  const r = await fetch(
    `/test/events?productId=${productId}&eventType=${eventType}&session=${testId}`,
  );
  const data = await r.json();
  const result = data.some((e: any) => match(e, event));
  if (!result) {
    console.info("Check Failed", data, event);
  }
  return result;
}

function checkNoErrors(): boolean {
  return errors.length === 0;
}

function checkEvents(
  eventType: string,
  productId: string,
  expected: number,
): boolean {
  const k = `${eventType}-${productId}`;
  if (eventsCount[k] !== expected) {
    console.info(`Found ${eventsCount[k]} events but wanted ${expected}`);
    return false;
  }
  return true;
}

async function setTestResult(
  testId: string,
  ok: boolean | Promise<boolean>,
): Promise<void> {
  const result = (await ok) ? "ok" : "fail";
  const el = document.getElementById(testId);
  if (!el) {
    throw new Error(`could not find ${testId}`);
  }
  el.className = result;
  el.innerText = result.toUpperCase();
}

async function delay(timeout: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function runTests() {
  // Click on product
  const product = document.getElementById("click1");
  product?.click();

  // Click on product area
  const productArea = document.getElementById("click-area");
  productArea?.click();

  // Add new product
  const newProduct = document.createElement("div");
  newProduct.dataset.tsProduct = "product-id-dyn-impression-1";
  newProduct.dataset.tsResolvedBid = "27785055-1d99-3b4e-94b0-5fc5cf60af3f";
  const container = document.getElementById("vanilla-js");
  container?.appendChild(newProduct);

  // Modify product
  const oldProduct = document.getElementById("old-product");
  if (oldProduct) {
    oldProduct.dataset.tsProduct = "product-id-attr-impression-2";
    oldProduct.dataset.tsResolvedBid = "27785055-2345-6789-94b0-5fc5cf60af3f";
  }

  // Make product visible
  const hiddenProduct = document.getElementById("hidden-product");
  if (hiddenProduct) {
    hiddenProduct.style.visibility = "visible";
    await delay(250);
    hiddenProduct.style.visibility = "none";
    await delay(250);
    hiddenProduct.style.visibility = "visible";
  }

  // Fetch next react page
  const button = document.getElementById("next-page-react");
  button?.click();
  await delay(250);

  // React router
  const link = document.getElementById("react-link");
  link?.click();
  await delay(250);

  // Go to Home so we can refresh the page
  document.getElementById("react-home")?.click();

  await delay(2500);
  await checkTests();
}

async function checkTests() {
  console.info("Checking results ...");

  await setTestResult(
    "test-impression",
    checkEventExists("product-id-impression-1", "impression", {
      entity: {
        id: "product-id-impression-1",
        type: "product",
      },
      resolvedBidId: "17785055-9d99-4b4e-9fb0-5fc4cff0af3f",
      placement: {
        path: "/test.html",
      },
    }),
  );

  await setTestResult(
    "test-hidden-impression",
    checkEventExists("product-id-impression-hidden", "impression", {
      entity: { id: "product-id-impression-hidden", type: "product" },
      placement: {
        path: "/test.html",
      },
    }),
  );

  await setTestResult(
    "test-hidden-impression-twice",
    Promise.resolve(
      checkEvents("Impression", "product-id-impression-hidden", 1),
    ),
  );

  await setTestResult(
    "test-new-impression",
    checkEventExists("product-id-dyn-impression-1", "impression", {
      entity: { id: "product-id-dyn-impression-1", type: "product" },
      resolvedBidId: "27785055-1d99-3b4e-94b0-5fc5cf60af3f",
    }),
  );

  await setTestResult(
    "test-attributes-impression",
    checkEventExists("product-id-attr-impression-2", "impression", {
      entity: { id: "product-id-attr-impression-2", type: "product" },
      resolvedBidId: "27785055-2345-6789-94b0-5fc5cf60af3f",
    }),
  );

  await setTestResult(
    "test-click",
    checkEventExists("product-id-click-1", "click", {
      entity: { id: "product-id-click-1", type: "product" },
      resolvedBidId: "dc7d20e0-c56f-4a2f-9359-cfb363e3ba5d",
      placement: {
        path: "/test.html",
      },
    }),
  );

  await setTestResult(
    "test-click-area",
    checkEventExists("product-id-click-2", "click", {
      entity: { id: "product-id-click-2", type: "product" },
      resolvedBidId: "dc7d20e0-c56f-4a2f-9359-cfb363e30000",
      placement: {
        path: "/test.html",
      },
    }),
  );

  await setTestResult(
    "test-purchase",
    checkEventExists("product-id-purchase-1", "purchase", {
      items: [
        { productId: "product-id-purchase-1", quantity: 1, unitPrice: 2399 },
        { productId: "product-id-purchase-2", quantity: 2, unitPrice: 399 },
      ],
    }),
  );

  await setTestResult(
    "test-react-impression",
    checkEventExists("p-r-6", "impression", {
      entity: {
        id: "p-r-6",
        type: "product",
      },
    }),
  );

  await setTestResult(
    "test-react-navigation",
    checkEventExists("p-r-3", "impression", {
      entity: { id: "p-r-3", type: "product" },
      placement: {
        path: "/other-test.html",
      },
    }),
  );

  await setTestResult("test-no-errors", checkNoErrors());

  console.info("Done checking results");
}

window.addEventListener("DOMContentLoaded", runTests);
