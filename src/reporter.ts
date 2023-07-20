import { version } from "./version";
import type { TopsortEvent } from "./events";

interface Config {
  token: string;
  url?: string;
}

export async function reportEvent(e: TopsortEvent, config: Config) {
  try {
    const url = (config.url || "https://api.topsort.com") + "/v2/events";
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Can't use User-Agent header because of
        // https://bugs.chromium.org/p/chromium/issues/detail?id=571722
        "X-UA": `ts.js/${version}`,
        Authorization: "Bearer " + config.token,
      },
      body: JSON.stringify(e),
      // This parameter ensures in most browsers that the request is performed even in case the browser navigates to another page.
      keepalive: true,
    });
    return { ok: r.ok, retry: r.status === 429 || r.status >= 500 };
  } catch (error) {
    return { ok: false, retry: true };
  }
}
