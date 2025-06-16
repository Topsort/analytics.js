![version](https://img.shields.io/npm/v/@topsort/analytics.js)
![downloads](https://img.shields.io/npm/dw/@topsort/analytics.js)
![license](https://img.shields.io/github/license/Topsort/analytics.js)
![GitHub Repo stars](https://img.shields.io/github/stars/topsort/analytics.js?style=social)
# Topsort Analytics.js Tutorial

This tutorial will guide you through the process of integrating Topsort's Analytics.js library into your website to track events like impressions, clicks, and purchases.

## 1. Introduction

Topsort's `analytics.js` is a JavaScript library that allows you to automatically report user interaction events with products on your website to Topsort's Analytics service. This helps you understand how users are interacting with sponsored and organic listings.

## 2. Installation

You can install the library using npm:

```bash
npm install @topsort/analytics.js --save
```

## 3. Usage with a Bundler (e.g., Webpack, Vite)

If you're building a JavaScript application with a bundler, you can import the library directly into your project.

### Initialization

In your application's entry point (e.g., `index.js`, `main.ts`), you need to configure Topsort Analytics *before* you import the library. The library's code runs on import and will look for a global `window.TS` object.

```javascript
// Configure Topsort Analytics
window.TS = {
  token: "<YOUR-TOPSORT.JS-TOKEN>", // Generate a token for each environment in the Topsort Auction Manager
  url: "https://api.topsort.com",
};

// Import the library to initialize it.
// This will start the event listeners.
import "@topsort/analytics.js";
```

The library will automatically start listening for DOM changes and user interactions once it's imported.

### Configuration

The configuration is done via the global `window.TS` object.

*   `token`: **(Required)** This is your unique Topsort.js token. You can generate a token for each of your environments (e.g., development, production) in the Topsort Auction Manager.
*   `url`: **(Optional)** The URL of the Topsort API. Defaults to `https://api.topsort.com`.

## 4. Tracking Impressions

The library automatically detects and reports impressions of products when they become visible on the screen. To enable this, you need to add the `data-ts-resolved-bid` attribute. The value should be the `resolvedBidId` you received from the Topsort API when you ran an auction.

```html
<div class="product" data-ts-resolved-bid="<resolvedBidId>">
  <!-- Your product content here -->
</div>
```

## 5. Tracking Clicks

The library can also track when a user clicks on a product. By default, it will consider a click on any part of the product element as a conversion.

If you want more granular control over what constitutes a clickable area, you can use the `data-ts-clickable` attribute. This is useful when only a part of the product container should trigger a click event (e.g., the image and title, but not a "help" icon).

```html
<div class="product" data-ts-resolved-bid="<resolvedBidId>">
  <div data-ts-clickable>
    <img src="https://example.com/product.png" alt="Product Image">
    <span>Product Title</span>
  </div>
  <span>Help</span>
</div>
```

## 6. Tracking Purchases

To track purchases, you need to add the `data-ts-action="purchase"` attribute to an element that the user interacts with to complete a purchase (e.g., a "Buy Now" or "Complete Purchase" button).

You also need to provide the details of the purchased items using the `data-ts-items` attribute. This attribute should contain a JSON string representing an array of purchased items. Each item object can have the following properties:

*   `product_id`: The ID of the product.
*   `quantity`: The quantity of the product purchased.
*   `price`: The price of the product.
*   `vendorId`: (Optional) The ID of the vendor.

```html
<button
  data-ts-action="purchase"
  data-ts-items='[{"product_id": "product-123", "quantity": 1, "price": 2399}, {"product_id": "product-456", "quantity": 2, "price": 399, "vendorId": "vendor-abc"}]'
>
  Complete Purchase
</button>
```

**Note:** The attribute value must be a valid JSON string. Ensure that you properly escape any quotes within the string.

## 7. Advanced Usage

### Banner Clicks

If you are using banners to promote products, you can track clicks on those banners and attribute them to the products on the banner's destination page.

When a user clicks a banner, they are taken to a destination page. On that page, for each product that was featured in the banner, add the `data-ts-resolved-bid="inherit"` attribute. This tells the library that the impression and potential click are a result of the banner interaction.

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
  token: "<YOUR-TOPSORT.JS-TOKEN>",
  getUserId() {
    token: "<YOUR-TOPSORT.JS-TOKEN>",
    getUserId() {
      // globalUserId is the user id you would like to pass to the analytics
      // generateAndStoreUserId is a function that generates a new user id and stores it in a cookie/local storage
      return globalUserId ?? generateAndStoreUserId();
    },
  },
};
```

This configuration needs to be set *before* the library is loaded or imported.

## 8. Tracking Organic Products

The library can track both impressions and clicks for organic products. This is optional but recommended for a more complete analytics picture of how users interact with all items on your site.

### Organic Product Impressions

To track impressions for an organic product, add the `data-ts-product` attribute with the product's unique ID.

### Organic Product Clicks

Clicks on organic products are tracked automatically when the product element has the `data-ts-product` attribute. If you need to specify which parts of the product element are clickable, you can use the `data-ts-clickable` attribute, just as you would for promoted products.

## 9. Troubleshooting

### "Uncaught Error: Mismatched anonymous define() module"

This error can occur if you are using an AMD loader like RequireJS. This library is not AMD-compatible. You should use the ESM version of the library (`ts.mjs`), which can be imported as a module in modern JavaScript environments, as shown in the "Usage with a Bundler" section.
