# Topsort Analytics.js Tutorial

![version](https://img.shields.io/npm/v/@topsort/analytics.js)
![downloads](https://img.shields.io/npm/dw/@topsort/analytics.js)
![license](https://img.shields.io/github/license/Topsort/analytics.js)
![GitHub Repo stars](https://img.shields.io/github/stars/topsort/analytics.js?style=social)

This tutorial will guide you through the process of integrating Topsort's Analytics.js library into your website to track events like renders, impressions, clicks, and purchases.

## Playground

Try the interactive playground at **https://topsort.github.io/analytics.js** — configure your token, add products, and see events fire in real time without any local setup.

## 1. Introduction

Topsort's `analytics.js` is a JavaScript library that allows you to automatically report user interaction events with products on your website to Topsort's Analytics service. This helps you understand how users are interacting with sponsored and organic listings.

## 2. Installation

You can install the library using npm:

```bash
npm install @topsort/analytics.js@2.12.1 --save-exact
```

Pin the version and upgrade deliberately. Versions before 2.12.0 on npm lack render events and the 1 second impression dwell.

## 3. Usage

### Option 1: With a Bundler (e.g., Webpack, Vite)

If you're building a JavaScript application with a bundler, you can import the library directly into your project.

You need to configure Topsort Analytics *before* the library loads: its code runs on import and reads the global `window.TS` object. Imports are evaluated before the rest of a module, so setting `window.TS` in the same file as the import is too late and the library throws on load. Put the configuration in its own module and import it first:

```javascript
// topsort-config.js
window.TS = {
  token: "<YOUR-TOPSORT-API-KEY>", // A Marketplace API key (starts with TSE_), see "Configuration"
  url: "https://api.topsort.com",
};
```

```javascript
// Your application's entry point (e.g., index.js, main.ts)
import "./topsort-config.js";
// Import the library to initialize it.
// This will start the event listeners.
import "@topsort/analytics.js";
```

The library will automatically start listening for DOM changes and user interactions once it's imported. If the token is not provided at initialization, events are queued until the token is set. To flush the queue, assign the token via **property assignment**:

```js
window.TS.token = "<YOUR-TOPSORT-API-KEY>";
```

> **Important:** Do **not** replace the entire `window.TS` object after the library has loaded (e.g. `window.TS = { token: "..." }`). The library installs an internal setter on the existing `window.TS` reference to detect when the token becomes available. Replacing the object destroys that setter and the queued events will never be sent.

### Option 2: With a Local Script File

If you are not using a bundler, you can include the library by serving the file yourself.

First, you'll need to locate the `ts.iife.js` file in your `node_modules` directory at `@topsort/analytics.js/dist/ts.iife.js`. It bundles everything the library needs; `dist/ts.js` expects `@topsort/sdk` to be loaded separately and does not work on its own. Copy this file to a public directory in your project that is served to the client (e.g., `public/` or `assets/`). The file belongs to the version you installed, so pin that version in `package.json` and update the copied file when you upgrade.

To load the file from a CDN instead, pin the version in the URL, for example `https://unpkg.com/@topsort/analytics.js@2.12.1/dist/ts.iife.js`. Do not use `@latest` or an unversioned URL.

Then, include it in your HTML file with a `<script>` tag. Make sure you configure `window.TS` *before* the script is loaded.

```html
<script>
  // Configure Topsort Analytics
  window.TS = {
    token: "<YOUR-TOPSORT-API-KEY>", // A Marketplace API key (starts with TSE_), see "Configuration"
    url: "https://api.topsort.com",
  };
</script>
<script src="/path/to/your/public/folder/ts.iife.js"></script>
```

## 4. Configuration

The configuration is done via the global `window.TS` object, which must be set before the library is loaded.

* `token`: **(Required)** Your Topsort Marketplace API key, which starts with `TSE_`. Generate one for each of your environments (e.g., development, production) in the Topsort app, as described in [API key types](https://docs.topsort.com/en/api-reference/authentication/api-key-types#marketplace-api-key).
* `url`: **(Optional)** The URL of the Topsort API. Defaults to `https://api.topsort.com`.
* `cookieName`: **(Optional)** Name of the cookie that stores the user ID. Defaults to `tsuid`.
* `getUserId`: **(Optional)** A function that returns your own user ID. See "Overriding User ID".

The library also exposes `window.TS.setUserId(id)` and `window.TS.resetUserId()`, and dispatches a `topsort` DOM event (a `CustomEvent` whose `detail` is the event data) on the element for every event it queues.

## 5. Tracking Renders

The library automatically reports a render event as soon as a sponsored ad is inserted into the page, using the same `data-ts-resolved-bid` attribute as impressions. A render is reported regardless of whether the element ever becomes visible — it only requires an explicit `resolvedBidId`, so it does not fire for organic products or for `data-ts-resolved-bid="inherit"`.

Renders let you distinguish ads that were delivered from ads that were actually seen (tracked separately as impressions).

## 6. Tracking Impressions

The library automatically detects and reports impressions of products when they become visible on the screen. To enable this, you need to add the `data-ts-resolved-bid` attribute. The value should be the `resolvedBidId` you received from the Topsort API when you ran an auction.

```html
<div class="product" data-ts-resolved-bid="<resolvedBidId>">
  <!-- Your product content here -->
</div>
```

### When an impression counts

An impression is reported only when all three of these hold:

1. At least 50% of the element is inside the viewport (`IntersectionObserver`).
2. The element is actually painted — not hidden by `display:none`, `visibility:hidden`, `opacity:0`, or `content-visibility:hidden` on itself or any ancestor.
3. Both of the above hold continuously for 1 second.

If the element drops below 50% or the tab is hidden before the second is up, the timer is cancelled and starts again from zero once the element is visible again. Each element reports at most one impression.

The second check matters because `IntersectionObserver` is purely geometric: it considers a `visibility:hidden` element visible as long as its box overlaps the viewport. Without the paint check, markup preloaded into a hidden container — a mega-menu revealed on hover, a closed drawer, an inactive tab — would record an impression on page load for something the shopper never saw.

You can therefore write the bid into the DOM as soon as the auction resolves, whatever the container's visibility. Once the element is revealed, the impression fires then. Reveals that change no geometry (a menu toggled via `visibility` or `opacity`) produce no `IntersectionObserver` callback, so they are detected by a short poll that runs only while the element is near the viewport.

> On engines without `IntersectionObserver`, viewport gating is unavailable: only the paint check and the 1 second dwell apply, and the dwell is not paused while the tab is hidden.

Because the check runs per element at the moment the impression would fire, it also holds for markup that is cloned or moved after render (responsive duplicates, carousel clones, tag-manager rewrites). Each copy is judged on its own visibility, but copies that carry the same product and bid on the same page count as one impression (see "Deduplication and Delivery").

## 7. Tracking Clicks

The library can also track when a user clicks on a product. By default, it will consider a click on any part of the product element as a conversion.

If you want more granular control over what constitutes a clickable area, you can use the `data-ts-clickable` attribute. This is useful when only a part of the product container should trigger a click event (e.g., the image and title, but not a "help" icon).

Only primary clicks are reported: middle clicks (mouse wheel) are not. A click is reported once per product and bid on a given page, so further clicks on the same product are ignored until the page is reloaded or the route changes. Click handlers are attached when the element is first processed, and when the element contains `data-ts-clickable` descendants only those are clickable.

```html
<div class="product" data-ts-resolved-bid="<resolvedBidId>">
  <div data-ts-clickable>
    <img src="https://cdn.marketplace.com/product.png" alt="Product Image">
    <span>Product Title</span>
  </div>
  <span>Help</span>
</div>
```

## 8. Tracking Purchases

To track purchases, add the `data-ts-action="purchase"` attribute to an element on your order confirmation page. The purchase is reported when that element is inserted into the page, not when it is clicked, so render it only after the order is completed.

Reloading the confirmation page reports the purchase again, because the library does not remember events across page loads. Render the element once per order.

You also need to provide the details of the purchased items using the `data-ts-items` attribute. This attribute should contain a JSON string representing an array of purchased items. Each item object can have the following properties:

* `product`: The ID of the product. Sent to Topsort as `productId`.
* `quantity`: The quantity of the product purchased.
* `price`: The price of one unit of the product, as a decimal number in your marketplace currency (for example `23.99`, not `2399`). Sent to Topsort as `unitPrice`.
* `vendorId` (optional): The ID of the vendor selling the product. Required for halo attribution, and recommended when a product is sold by more than one vendor.

```html
<!-- On the order confirmation page, rendered once the order is completed -->
<div
  data-ts-action="purchase"
  data-ts-items='[{"product": "product-123", "quantity": 1, "price": 23.99}, {"product": "product-456", "quantity": 2, "price": 3.99, "vendorId": "vendor-abc"}]'
  hidden
></div>
```

**Note:** The attribute value must be a valid JSON string. Ensure that you properly escape any quotes within the string.

## 9. Advanced Usage

### Banner Clicks

If you are using banners to promote products, you can track clicks on those banners and attribute them to the products on the banner's destination page.

When a user clicks a banner, they are taken to a destination page. On that page, for each product that was featured in the banner, add the `data-ts-resolved-bid="inherit"` attribute. This tells the library that the impression and potential click are a result of the banner interaction.

The library attaches the most recently clicked sponsored bid in the current browser tab (kept in `sessionStorage`) to the product, which is reported as an additional attribution. Keep these points in mind:

* `data-ts-product` is required alongside `inherit`. Without it, the literal value `inherit` is sent as the bid.
* It applies to clicks and impressions, never to renders.
* If no sponsored element was clicked earlier in the tab, the event is sent without a bid.

```html
<div class="product" data-ts-product="<productId>" data-ts-resolved-bid="inherit">
  <!-- Product content -->
</div>
```

### Overriding User ID

By default, the library manages a user ID to track user sessions. If you want to use your own user identification system, you can override the `getUserId` function in the `window.TS` configuration.

Your custom `getUserId` function should return the user's ID as a string. You are responsible for generating and persisting the ID (e.g., in a cookie or local storage).

```javascript
window.TS = {
  token: "<YOUR-TOPSORT-API-KEY>",
  getUserId() {
    // globalUserId is the user id you would like to pass to the analytics
    // generateAndStoreUserId is a function that generates a new user id and stores it in a cookie/local storage
    return globalUserId ?? generateAndStoreUserId();
  },
};
```

This configuration needs to be set *before* the library is loaded or imported.

To keep the library's cookie-based ID instead, you can call `window.TS.setUserId("<id>")` to store your own ID in the cookie (named `tsuid` unless you set `cookieName`). It applies to events created after the call. If you provide `getUserId`, the cookie and `setUserId` are not used for event IDs.

### Deduplication and Delivery

Within one page load, the library reports each combination of route, event type, product, bid and purchase items only once. The route is the path plus the query string (or the hash, for hash routers), so navigating to another route allows the same product to be reported again, and a page reload resets everything. Requests that fail with a network error or a 4xx response are dropped. A 429 or 5xx response is retried up to 3 times with exponential backoff.

## 10. Tracking Organic Products

The library can track both impressions and clicks for organic products. This is optional but recommended for a more complete analytics picture of how users interact with all items on your site.

### Organic Product Impressions

To track impressions for an organic product, add the `data-ts-product` attribute with the product's unique ID.

### Organic Product Clicks

Clicks on organic products are tracked automatically when the product element has the `data-ts-product` attribute. If you need to specify which parts of the product element are clickable, you can use the `data-ts-clickable` attribute, just as you would for promoted products.

## 11. Local Development for playground

To run the playground locally:

```bash
npm install
npm run playground
```

This builds the library and serves the project. Open the URL shown in the terminal and navigate to `/demo/`.

## 12. Troubleshooting

### "Uncaught Error: Mismatched anonymous define() module"

This error can occur if you are using an AMD loader like RequireJS. This library is not AMD-compatible. You should use the ESM version of the library (`ts.mjs`), which can be imported as a module in modern JavaScript environments, as shown in "Option 1: With a Bundler".
