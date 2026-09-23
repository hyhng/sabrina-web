'use client';

import { FILTER_LABELS, FILTER_VALUES, type FilterValue } from '@sabrina/shared/filter';

/**
 * Category filter (Figma UI 04 node 154:61, UI 06 node 154:323).
 *
 * All · Commercial · Art. The active item is full strength with a rule under
 * it; the others are dimmed and keep an invisible rule so nothing shifts when
 * the selection moves.
 *
 * Buttons with aria-pressed, not links: nothing is fetched, the grid just
 * re-lays out (docs/SPEC.md 3.4). The URL is updated by the caller.
 */
export interface FilterProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

export function Filter({ value, onChange }: FilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter projects by category"
      className="flex items-start gap-[20px] text-[14px] tablet:gap-[22px] tablet:text-[15px] desktop:gap-[24px]"
    >
      {FILTER_VALUES.map((item) => {
        const active = item === value;
        return (
          <button
            key={item}
            type="button"
            aria-pressed={active}
            onClick={() => {
              onChange(item);
            }}
            className="flex cursor-pointer flex-col gap-[3px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <span className={active ? 'text-ink' : 'text-filter-inactive'}>
              {FILTER_LABELS[item]}
            </span>
            {/* Always in the layout, only sometimes visible. */}
            <span aria-hidden className={`h-px bg-ink ${active ? '' : 'opacity-0'}`} />
          </button>
        );
      })}
    </div>
  );
}
