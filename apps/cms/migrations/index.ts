import * as migration_20261001_081505_initial from './20261001_081505_initial';
import * as migration_20261013_180226_add_fashion_category from './20261013_180226_add_fashion_category';
import * as migration_20261013_180944_category_order from './20261013_180944_category_order';
import * as migration_20261013_190445_reconcile_category_order from './20261013_190445_reconcile_category_order';
import * as migration_20261013_204619_category_labels from './20261013_204619_category_labels';
import * as migration_20261020_120800_settings_phone from './20261020_120800_settings_phone';

export const migrations = [
  {
    up: migration_20261001_081505_initial.up,
    down: migration_20261001_081505_initial.down,
    name: '20261001_081505_initial',
  },
  {
    up: migration_20261013_180226_add_fashion_category.up,
    down: migration_20261013_180226_add_fashion_category.down,
    name: '20261013_180226_add_fashion_category',
  },
  {
    up: migration_20261013_180944_category_order.up,
    down: migration_20261013_180944_category_order.down,
    name: '20261013_180944_category_order',
  },
  {
    up: migration_20261013_190445_reconcile_category_order.up,
    down: migration_20261013_190445_reconcile_category_order.down,
    name: '20261013_190445_reconcile_category_order',
  },
  {
    up: migration_20261013_204619_category_labels.up,
    down: migration_20261013_204619_category_labels.down,
    name: '20261013_204619_category_labels',
  },
  {
    up: migration_20261020_120800_settings_phone.up,
    down: migration_20261020_120800_settings_phone.down,
    name: '20261020_120800_settings_phone'
  },
];
