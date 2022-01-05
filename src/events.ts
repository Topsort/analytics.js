interface Session {
  sessionId: string;
  consumerId?: string;
  orderIntentId?: string;
  orderId?: string;
}

interface Placement {
  page: string;
  location?: string;
}

interface Impression {
  placement: Placement;
  productId: string;
  id: string;
  auctionId?: string;
}

interface Item {
  productId: string;
  auctionId?: string;
  quantity?: number;
  unitPrice: number;
}

interface ImpressionEvent {
  eventType: "impression";
  session: Session;
  impressions: Impression[];
  occurredAt: string;
}

interface ClickEvent {
  eventType: "click";
  session: Session;
  id: string;
  placement: Placement;
  productId: string;
  auctionId?: string;
  occurredAt: string;
}

interface PurchaseEvent {
  eventType: "purchase";
  session: Session;
  id: string;
  purchasedAt: string;
  items: Item[];
}

export type TopsortEvent = ImpressionEvent | ClickEvent | PurchaseEvent;
