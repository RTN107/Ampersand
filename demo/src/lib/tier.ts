// The exact strings below are matched by the backend's scoring logic.
// Do not alter capitalization, spacing or wording. Display labels are separate.

export const WAREHOUSE_OPTIONS = ['1', '2-5', '6-10', '10+'] as const;
export const ORDER_OPTIONS = ['Under 500', '500 to 5000', '5000 to 20000', '20000+'] as const;
export const TOOLING_OPTIONS = ['Spreadsheets or manual', 'Nothing', 'Another platform'] as const;
export const TIMELINE_OPTIONS = ['This month', 'This quarter', 'Just exploring'] as const;
export const TIERS = ['Starter', 'Growth', 'Scale', 'Gold'] as const;

export type WarehouseCount = (typeof WAREHOUSE_OPTIONS)[number];
export type OrderVolume = (typeof ORDER_OPTIONS)[number];
export type Tooling = (typeof TOOLING_OPTIONS)[number];
export type Timeline = (typeof TIMELINE_OPTIONS)[number];
export type Tier = (typeof TIERS)[number];

export type LeadPayload = {
  name: string;
  email: string;
  company: string;
  warehouse_count: WarehouseCount;
  order_volume: OrderVolume;
  current_tooling: Tooling;
  timeline: Timeline;
};

export const WAREHOUSE_LABELS: Record<WarehouseCount, string> = {
  '1': '1 warehouse',
  '2-5': '2 to 5',
  '6-10': '6 to 10',
  '10+': '10 or more',
};

export const ORDER_LABELS: Record<OrderVolume, string> = {
  'Under 500': 'Under 500',
  '500 to 5000': '500 to 5,000',
  '5000 to 20000': '5,000 to 20,000',
  '20000+': '20,000 or more',
};

// Tier is set by whichever number is higher, warehouse count or order volume.
export function tierFor(w: WarehouseCount, o: OrderVolume): Tier {
  const wi = WAREHOUSE_OPTIONS.indexOf(w);
  const oi = ORDER_OPTIONS.indexOf(o);
  return TIERS[Math.max(wi, oi)];
}

export function tierIndex(t: Tier): number {
  return TIERS.indexOf(t);
}
