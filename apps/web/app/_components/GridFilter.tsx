'use client';

import { Filter } from '@sabrina/ui';

import { setFilter, useFilter } from '../../lib/use-filter.ts';

export function GridFilter() {
  return <Filter value={useFilter()} onChange={setFilter} />;
}
