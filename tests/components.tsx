import React, { useState } from "react";
import ReactDom from "react-dom";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function Product({
  productId,
  auctionId,
}: React.HTMLProps<HTMLDivElement> & {
  productId: string;
  auctionId?: string;
}) {
  return (
    <div data-ts-product={productId} data-ts-auction={auctionId}>
      {productId}
    </div>
  );
}

function Page({ idx }: { idx: number }) {
  const products = [
    {
      productId: `p-r-${3 * (idx - 1) + 1}`,
      auctionId: idx === 1 ? "a-1" : undefined,
    },
    {
      productId: `p-r-${3 * (idx - 1) + 2}`,
      auctionId: idx === 1 ? "a-1" : undefined,
    },
    { productId: `p-r-${3 * (idx - 1) + 3}`, auctionId: undefined },
  ];
  return (
    <div>
      {products.map((p) => (
        <Product
          productId={p.productId}
          auctionId={p.auctionId}
          key={p.productId}
        />
      ))}
    </div>
  );
}

function InfinitePages() {
  const [idx, setIdx] = useState(1);
  return (
    <>
      <button onClick={() => setIdx(idx + 1)} id="next-page-react">
        Next
      </button>
      <Page idx={idx} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Link id="react-home" to="/test.html">
        Home
      </Link>
      <Link id="react-link" to="/other-test.html">
        Other Test
      </Link>
      <Routes>
        <Route
          path="/other-test.html"
          element={<InfinitePages key="other" />}
        />
        <Route path="/test.html" element={<InfinitePages key="test" />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDom.render(<App />, document.getElementById("root"));
