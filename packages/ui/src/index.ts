/**
 * @diffland/ui — React renderers.
 *
 * Views are pure components of (data: DiffLandData) => ReactNode.
 * Phase 3 ships VillageView.
 */
import { hello as coreHello } from '@diffland/core';

export function hello(): string {
  return `${coreHello()} + ui`;
}
