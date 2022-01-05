import React, { useState } from "react";
import ReactDom from "react-dom";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function Product({
  sku,
  auction,
}: React.HTMLProps<HTMLDivElement> & { sku: string; auction?: string }) {
  return <div data-sku={`${sku}:${auction}`}>{sku}</div>;
}

function Page({ idx }: { idx: number }) {
  const products = [
    { sku: `p-r-${3 * (idx - 1) + 1}`, auction: idx === 1 ? "a-1" : undefined },
    { sku: `p-r-${3 * (idx - 1) + 2}`, auction: idx === 1 ? "a-1" : undefined },
    { sku: `p-r-${3 * (idx - 1) + 3}`, auction: undefined },
  ];
  return (
    <div>
      {products.map((p) => (
        <Product sku={p.sku} auction={p.auction} key={p.sku} />
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
