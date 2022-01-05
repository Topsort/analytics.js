import { reportEvent } from "./reporter";

import "isomorphic-fetch";
import nock from "nock";

test("success", async () => {
  nock("https://api.topsort.com").post("/v1/events").reply(200, {});
  await expect(reportEvent({}, { token: "token" })).resolves.toEqual({
    ok: true,
    retry: false,
  });
});

test("permanent error", async () => {
  nock("https://api.topsort.com").post("/v1/events").reply(400, {});
  await expect(reportEvent({}, { token: "token" })).resolves.toEqual({
    ok: false,
    retry: false,
  });
});

test("retryable error", async () => {
  nock("https://api.topsort.com").post("/v1/events").reply(429, {});
  await expect(reportEvent({}, { token: "token" })).resolves.toEqual({
    ok: false,
    retry: true,
  });
});

test("unexpected error", async () => {
  nock("https://api.topsort.com").post("/v2/events").reply(200, {});
  await expect(reportEvent({}, { token: "token" })).resolves.toEqual({
    ok: false,
    retry: true,
  });
});

test("custom url", async () => {
  nock("https://demo.api.topsort.com").post("/v1/events").reply(200, {});
  await expect(
    reportEvent({}, { token: "token", url: "https://demo.api.topsort.com" })
  ).resolves.toEqual({ ok: true, retry: false });
});
