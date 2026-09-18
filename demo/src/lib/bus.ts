import type { WarehouseCount } from './tier';
import { scrollTo } from './scroll';

// Tiny page-level events so sections can talk without prop drilling.

export const QUOTE_PRESET_EVENT = 'flowdeck:quote-preset';

export function openQuote(preset?: WarehouseCount): void {
  if (preset) {
    window.dispatchEvent(new CustomEvent(QUOTE_PRESET_EVENT, { detail: preset }));
  }
  scrollTo('#quote', -40);
}
