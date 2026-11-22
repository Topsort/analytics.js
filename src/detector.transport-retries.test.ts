import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("retries a sponsored click with its original ID and discards a rejected impression", async () => {
  vi.useFakeTimers();
  window.TS = { token: "token", url: "https://events.example.invalid" };
  const ad = document.createElement("button");
  ad.dataset.tsResolvedBid = "bid-1";
  document.body.appendChild(ad);

  const sendClick = vi
    .fn<(id: string) => Promise<Response>>()
    .mockRejectedValueOnce(new TypeError("Network connection lost"))
    .mockResolvedValueOnce(new Response("<html>Bad Gateway</html>", { status: 502 }))
    .mockResolvedValue(new Response(null, { status: 204 }));
  const sendImpression = vi.fn(() => new Response("<html>Bad Request</html>", { status: 400 }));
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    const event = JSON.parse(String(init.body));
    if (event.clicks) return sendClick(event.clicks[0].id);
    if (event.impressions) return sendImpression();
    return new Response(null, { status: 204 });
  });

  await import("./detector");
  ad.click();
  await vi.advanceTimersByTimeAsync(1500);

  const id = sendClick.mock.calls[0]?.[0];
  expect(id).toEqual(expect.any(String));
  expect(sendImpression).toHaveBeenCalledTimes(1);
  const queued = () => JSON.parse(localStorage.getItem("ts-q") ?? "[]");
  expect(queued()).toMatchObject([{ e: { id, type: "Click" }, r: 1 }]);

  await vi.advanceTimersByTimeAsync(2000);
  expect(sendClick.mock.calls).toEqual([[id], [id]]);
  expect(queued()).toMatchObject([{ e: { id }, r: 2 }]);

  await vi.advanceTimersByTimeAsync(3000);
  expect(sendClick.mock.calls).toEqual([[id], [id], [id]]);
  expect(sendImpression).toHaveBeenCalledTimes(1);
  expect(queued()).toEqual([]);
});
