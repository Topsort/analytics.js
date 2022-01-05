const errors: any[] = [];
function errorHandler(error: any) {
  errors.push(error);
}

window.addEventListener("error", errorHandler);
window.addEventListener("unhandledrejection", errorHandler);

interface Purchase {
  productId?: string;
  quantity?: number;
  unitPrice?: number;
}

interface Placement {
  page: string;
}

interface Impression {
  placement?: Placement;
  productId?: string;
  auctionId?: string;
  id?: string;
}

interface ProductEvent {
  eventType?: string;
  placement?: Placement;
  productId?: string;
  auctionId?: string | null;
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
  sku: string,
  event: ProductEvent
): Promise<boolean> {
  const testId = (window as any).testId;
  const r = await fetch(`/test/events?productId=${sku}&session=${testId}`);
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

async function setTestResult(
  testId: string,
  ok: boolean | Promise<boolean>
): Promise<void> {
  const result = (await ok) ? "ok" : "fail";
  const el = document.getElementById(testId);
  if (!el) {
    throw new Error(`could not find ${testId}`);
  }
  el.className = result;
  el.innerText = result.toUpperCase();
}

async function checkTests() {
  // Click on product
  const el = document.getElementById("click1");
  el?.click();

  // Add new product
  const newProduct = document.createElement("div");
  newProduct.dataset.sku =
    "product-id-dyn-impression-1:27785055-1d99-3b4e-94b0-5fc5cf60af3f";
  const container = document.getElementById("vanilla-js");
  container?.appendChild(newProduct);

  // Modify product
  const oldProduct = document.getElementById("old-product");
  if (oldProduct) {
    oldProduct.dataset.sku =
      "product-id-attr-impression-2:27785055-2345-6789-94b0-5fc5cf60af3f";
  }

  // Fetch next react page
  const button = document.getElementById("next-page-react");
  button?.click();

  // React router
  const link = document.getElementById("react-link");
  link?.click();

  await new Promise((resolve) => setTimeout(resolve, 2500));

  await setTestResult(
    "test-impression",
    checkEventExists("product-id-impression-1", {
      eventType: "impression",
      impressions: [
        {
          productId: "product-id-impression-1",
          auctionId: "17785055-9d99-4b4e-9fb0-5fc4cff0af3f",
          placement: {
            page: "/test.html",
          },
        },
      ],
    })
  );

  await setTestResult(
    "test-new-impression",
    checkEventExists("product-id-dyn-impression-1", {
      eventType: "impression",
      impressions: [
        {
          productId: "product-id-dyn-impression-1",
          auctionId: "27785055-1d99-3b4e-94b0-5fc5cf60af3f",
        },
      ],
    })
  );

  await setTestResult(
    "test-attributes-impression",
    checkEventExists("product-id-attr-impression-2", {
      eventType: "impression",
      impressions: [
        {
          productId: "product-id-attr-impression-2",
          auctionId: "27785055-2345-6789-94b0-5fc5cf60af3f",
        },
      ],
    })
  );

  await setTestResult(
    "test-click",
    checkEventExists("product-id-click-1", {
      eventType: "click",
      productId: "product-id-click-1",
      auctionId: "dc7d20e0-c56f-4a2f-9359-cfb363e3ba5d",
      placement: {
        page: "/test.html",
      },
    })
  );

  await setTestResult(
    "test-purchase",
    checkEventExists("product-id-purchase-1", {
      eventType: "purchase",
      items: [
        { productId: "product-id-purchase-1", quantity: 1, unitPrice: 2399 },
        { productId: "product-id-purchase-2", quantity: 2, unitPrice: 399 },
      ],
    })
  );

  await setTestResult(
    "test-react-impression",
    checkEventExists("p-r-6", {
      eventType: "impression",
      impressions: [
        {
          productId: "p-r-6",
        },
      ],
    })
  );

  await setTestResult(
    "test-react-navigation",
    checkEventExists("p-r-3", {
      eventType: "impression",
      impressions: [
        {
          productId: "p-r-3",
          placement: {
            page: "/other-test.html",
          },
        },
      ],
    })
  );

  await setTestResult("test-no-errors", checkNoErrors());

  // Go to Home so we can refresh the page
  document.getElementById("react-home")?.click();
}

window.addEventListener("DOMContentLoaded", checkTests);
