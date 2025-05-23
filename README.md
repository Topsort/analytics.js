![version](https://img.shields.io/npm/v/@topsort/analytics.js)
![downloads](https://img.shields.io/npm/dw/@topsort/analytics.js)
![license](https://img.shields.io/github/license/Topsort/analytics.js)
![GitHub Repo stars](https://img.shields.io/github/stars/topsort/analytics.js?style=social)

# Topsort analytics.js

Topsort's JS analytics event library

Use this to send clicks and impressions to the Topsort API.

# Installation

With npm

```
npm install @topsort/analytics.js --save
```

# Usage

### Load topsort.js

```html
<script>
  window.TS = {
    token: "<YOUR-TOPSORT.JS-TOKEN>", // Generate a token for each environment in the Topsort Auction Manager
    url: "https://api.topsort.com",
  };
</script>
<script src="https://unpkg.com/@topsort/analytics.js@2.4.0/dist/ts.js"></script>
```

### Add markup to your products

Either mix quotes (single/double) or escape certain characters inside your values. In javascript:

```js
const newvalue = currentvalue.replace('"', "&quot;").replace("'", "&apos;"); // etc.
```

Add the following markup to promoted products:

```html
<div class="product" data-ts-resolved-bid="<resolvedBidId>">...</div>
```

and the following for organic products (which is optional)

```html
<div class="product" data-ts-product="<productId>">...</div>
```

Additionally, in case not all the container is clickable (i.e., does not produce an action or does not take you to the product page) or parts of it lead you to a non-related product page, make sure to use the `data-ts-clickable` attribute to indicate what portions of the product should count as a conversion.

```html
<div class="product" ...>
  <div data-ts-clickable>
    <img src="https://cdn.marketplace.com/product.png" />
    <span>Product Title</span>
  </div>
  <span>Help</span>
</div>
```

Adding further information to purchases can be made by passing the `ts-data-items` JSON array:

```html
<div
  data-ts-action="purchase"
  data-ts-items='[{"product": "product-id-purchase-1", "quantity":1, "price": 2399}, {"product": "product-id-purchase-2", "quantity": 2, "price": 399, "vendorId": "example-vendor"}]'
>
  My purchase
</div>
```

Finally, in case you are using banners and want to have further control on the attributable products you need to add the following markup in the banner's destination page.

```html
<div
  class="product"
  data-ts-product="<productId>"
  data-ts-resolved-bid="inherit"
>
  ...
</div>
```

### Overriding default User ID behavior

If you want to pass your own User ID when sending events, you can do so by overiding the `getUserID()` function which is
responsible for retrieving a unique identifier for the user. It should additionally set a new value if none is found. This function should return a string with the User ID (as a string) passed in the events.

```javascript
window.TS = {
	token: "<YOUR-TOPSORT.JS-TOKEN>",
	getUserId() {
		// globalUserId is the user id you would like to pass to the analytics
		// generateAndStoreUserId is a function that generates a new user id and stores it in a cookie/local storage
		return globalUserId ?? generateAndStoreUserId();
	},
};
```

```html
# Troubleshooting

## I see `Uncaught Error: Mismatched anonymous define() module` in the browser console

You are most likely running into issues with how the library is loaded. This is a common issue with RequireJS and other AMD loaders. The library is not AMD compatible, so you need to load it as a global script.

Another approach is to use the ESM version of the library, which you can either import directly should you import the library as part of your distribution; or use the published version called `ts.mjs`: `https://unpkg.com/@topsort/analytics.js@2.4.0/dist/ts.mjs`.

# E2E tests

Execute `npm run test:e2e`, at the end it will show you the url you need to visit to test the library.

Ideally you would check the library both in desktop and mobile browsers. For that you need to be connected to the same network.
