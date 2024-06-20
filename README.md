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
    token: "<YOUR-TOPSORT.JS-TOKEN>", // This token is provided by Topsort and you'll have one for each of your environments
    url: "https://api.topsort.com",
  };
</script>
<script src="https://unpkg.com/@topsort/analytics.js@2.2.0/dist/ts.js"></script>
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
  data-ts-items='[{"product": "product-id-purchase-1", "quantity":1, "price": 2399}, {"product": "product-id-purchase-2", "quantity": 2, "price": 399}]'
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

# E2E tests

Execute `npm run test:e2e`, at the end it will show you the url you need to visit to test the library.

Ideally you would check the library both in desktop and mobile browsers. For that you need to be connected to the same network.
