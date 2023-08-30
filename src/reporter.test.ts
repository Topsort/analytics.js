import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { reportEvent } from "./reporter";
import type { TopsortEvent } from "./events";
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.post("https://api.topsort.com/v2/events", (_, res, ctx) => {
    return res(ctx.json({}), ctx.status(200));
  }),

  rest.post("https://error.api.topsort.com/v2/events", (_, res) => {
    return res.networkError("Failed to connect");
  }),
);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

function returnStatus(
  status: number,
  url = "https://api.topsort.com/v2/events",
): void {
  return server.use(
    rest.post(url, (_, res, ctx) => {
      return res(ctx.json({}), ctx.status(status));
    }),
  );
}

test("success", async () => {
  await expect(
    reportEvent({} as TopsortEvent, { token: "token" }),
  ).resolves.toEqual({
    ok: true,
    retry: false,
  });
});

test("network error", async () => {
  await expect(
    reportEvent({} as TopsortEvent, {
      token: "token",
      url: "https://error.api.topsort.com/",
    }),
  ).resolves.toEqual({
    ok: false,
    retry: true,
  });
});

test("permanent error", async () => {
  returnStatus(400);
  await expect(
    reportEvent({} as TopsortEvent, { token: "token" }),
  ).resolves.toEqual({
    ok: false,
    retry: false,
  });
});

test("authentication error", async () => {
  returnStatus(401);
  await expect(
    reportEvent({} as TopsortEvent, { token: "token" }),
  ).resolves.toEqual({
    ok: false,
    retry: false,
  });
});

test("retryable error", async () => {
  returnStatus(429);
  await expect(
    reportEvent({} as TopsortEvent, { token: "token" }),
  ).resolves.toEqual({
    ok: false,
    retry: true,
  });
});

test("server error", async () => {
  returnStatus(500);
  await expect(
    reportEvent({} as TopsortEvent, { token: "token" }),
  ).resolves.toEqual({
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
