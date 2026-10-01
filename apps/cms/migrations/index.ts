import * as migration_20261001_081505_initial from './20261001_081505_initial';

export const migrations = [
  {
    up: migration_20261001_081505_initial.up,
    down: migration_20261001_081505_initial.down,
    name: '20261001_081505_initial'
  },
];
