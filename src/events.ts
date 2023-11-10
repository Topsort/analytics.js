interface Placement {
  path: string;
}

export interface Entity {
  type: "product";
  id: string;
}

interface Impression {
  resolvedBidId?: string;
  entity?: Entity;
  additionalAttribution?: Entity;
  placement: Placement;
  occurredAt: string;
  opaqueUserId: string;
  id: string;
}

interface Click {
  resolvedBidId?: string;
  entity?: Entity;
  additionalAttribution?: Entity;
  placement: Placement;
  occurredAt: string;
  opaqueUserId: string;
  id: string;
}

interface Item {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface Purchase {
  occurredAt: string;
  opaqueUserId: string;
  id: string;
  items: Item[];
}

export interface TopsortEvent {
  impressions?: Impression[];
  clicks?: Click[];
  purchases?: Purchase[];
}
