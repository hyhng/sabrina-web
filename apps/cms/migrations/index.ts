import * as migration_20261001_081505_initial from './20261001_081505_initial';
import * as migration_20261013_180226_add_fashion_category from './20261013_180226_add_fashion_category';

export const migrations = [
  {
    up: migration_20261001_081505_initial.up,
    down: migration_20261001_081505_initial.down,
    name: '20261001_081505_initial',
  },
  {
    up: migration_20261013_180226_add_fashion_category.up,
    down: migration_20261013_180226_add_fashion_category.down,
    name: '20261013_180226_add_fashion_category'
  },
];
