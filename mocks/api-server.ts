import * as os from "os";
import * as path from "path";
import * as url from "url";

import express from "express";

const PORT = process.env.port || 8000;

const app = express();

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getRoot() {
  let r = path.join(__dirname, "..");
  if (path.basename(r) === "dist") {
    r = path.join(r, "..");
  }
  return r;
}

const root = getRoot();
console.info(__dirname, root, path.join(root, "tests", "test.html"));
app.use("/test.html", express.static(path.join(root, "tests", "test.html")));
app.use("/js", express.static(path.join(root, "dist")));

app.use(express.json());

const events: Record<string, any[]> = {};

function addEvent(productId: string, eventType: string, event: any, session: string): void {
  const namespacedProductId = `${session}-${eventType}-${productId}`;
  if (!events[namespacedProductId]) {
    events[namespacedProductId] = [];
  }
  events[namespacedProductId]?.push(event);
}

function getNetworkIp(): string {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }
  return "127.0.0.1";
}

app.post("/:session/v2/events", (req, res) => {
  const session = req.params.session;
  console.info(session, req.body);
  const payload = req.body;
  let totalEvents = 0;
  for (const event of payload.impressions ?? []) {
    addEvent(event.entity?.id ?? event.additionalAttribution?.id, "impression", event, session);
    totalEvents++;
  }
  for (const event of payload.clicks ?? []) {
    addEvent(event.entity?.id ?? event.additionalAttribution?.id, "click", event, session);
    totalEvents++;
  }
  for (const event of payload.purchases ?? []) {
    for (const item of event.items) {
      addEvent(item.productId, "purchase", event, session);
      totalEvents++;
    }
  }

  if (totalEvents === 0) {
    return res.sendStatus(400);
  }
  console.info(session, events);
  return res.sendStatus(200);
});

app.get("/test/events", (req, res) => {
  const productId = req.query.productId;
  const eventType = req.query.eventType;
  const session = req.query.session;
  const namespacedProductId = `${session}-${eventType}-${productId}`;
  console.info("get events", namespacedProductId, events[namespacedProductId]);
  res.json(events[namespacedProductId] || []);
});

app.listen(PORT, () => console.log(`Visit http://${getNetworkIp()}:${PORT}/test.html`));
