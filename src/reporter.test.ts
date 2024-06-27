import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import type { TopsortEvent } from "./events";
import { reportEvent } from "./reporter";

const server = setupServer(
  http.post("https://api.topsort.com/v2/events", () => {
    return HttpResponse.json({}, { status: 200 });
  }),

  http.post("https://error.api.topsort.com/v2/events", () => {
    return HttpResponse.error();
  }),
);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

function returnStatus(status: number, url = "https://api.topsort.com/v2/events"): void {
  return server.use(
    http.post(url, () => {
      return HttpResponse.json({}, { status: status });
    }),
  );
}

test("success", async () => {
  await expect(reportEvent({} as TopsortEvent, { token: "token" })).resolves.toEqual({
    ok: true,
    retry: false,
  });
});

test("network error", async () => {
  await expect(
    reportEvent({} as TopsortEvent, {
      token: "token",
      url: "https://error.api.topsort.com",
    }),
  ).resolves.toEqual({
    ok: false,
    retry: true,
  });
});

test("permanent error", async () => {
  returnStatus(400);
  await expect(reportEvent({} as TopsortEvent, { token: "token" })).resolves.toEqual({
    ok: false,
    retry: false,
  });
});

test("authentication error", async () => {
  returnStatus(401);
  await expect(reportEvent({} as TopsortEvent, { token: "token" })).resolves.toEqual({
    ok: false,
    retry: false,
  });
});

test("retryable error", async () => {
  returnStatus(429);
  await expect(reportEvent({} as TopsortEvent, { token: "token" })).resolves.toEqual({
    ok: false,
    retry: true,
  });
});

test("server error", async () => {
  returnStatus(500);
  await expect(reportEvent({} as TopsortEvent, { token: "token" })).resolves.toEqual({
    ok: false,
    retry: true,
  });
});

test("custom url", async () => {
  returnStatus(200, "https://demo.api.topsort.com/v2/events");
  await expect(
    reportEvent({} as TopsortEvent, {
      token: "token",
      url: "https://demo.api.topsort.com",
    }),
  ).resolves.toEqual({ ok: true, retry: false });
});
