SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM telebase_v4_dev.cnt_contents;
DELETE FROM telebase_v4_dev.sys_timer_entries;
DELETE FROM telebase_v4_dev.sys_templates;

DELETE FROM telebase_v4_dev.evt_event_tags;
DELETE FROM telebase_v4_dev.evt_embeds;
DELETE FROM telebase_v4_dev.evt_media;
DELETE FROM telebase_v4_dev.evt_starred;
DELETE FROM telebase_v4_dev.evt_events;
DELETE FROM telebase_v4_dev.evt_categories;
DELETE FROM telebase_v4_dev.evt_sections;
DELETE FROM telebase_v4_dev.evt_tags;
DELETE FROM telebase_v4_dev.evt_types;

DELETE FROM telebase_v4_dev.led_transaction_tags;
DELETE FROM telebase_v4_dev.led_transactions;
DELETE FROM telebase_v4_dev.led_transaction_groups;
DELETE FROM telebase_v4_dev.led_month_totals;
DELETE FROM telebase_v4_dev.led_accounts;
DELETE FROM telebase_v4_dev.led_categories;
DELETE FROM telebase_v4_dev.led_layers;

DELETE FROM telebase_v4_dev.stf_expenses;
DELETE FROM telebase_v4_dev.stf_register;
DELETE FROM telebase_v4_dev.stf_things;
DELETE FROM telebase_v4_dev.stf_locations;

DELETE FROM telebase_v4_dev.refresh_tokens;
DELETE FROM telebase_v4_dev.users;

INSERT INTO telebase_v4_dev.users (
  id, name, email, email_verified_at, password, status, remember_token,
  current_team_id, profile_photo_path, created_at, updated_at
)
SELECT
  id, name, email, email_verified_at, password, status, remember_token,
  current_team_id, profile_photo_path, created_at, updated_at
FROM telebase_prod_snapshot_20260710.users;

INSERT INTO telebase_v4_dev.refresh_tokens (
  id, token, user_id, user_agent, ip_address, expires_at, created_at, updated_at
)
SELECT
  id, token, user_id, user_agent, ip_address, expires_at, created_at, updated_at
FROM telebase_prod_snapshot_20260710.refresh_tokens;

INSERT INTO telebase_v4_dev.evt_categories (
  id, user_id, name, description, color, bgcolor, sort_order,
  is_archived, is_default, created_at, updated_at
)
SELECT
  id, user_id, name, description, color, bgcolor, sort_order,
  is_archived, is_default, created_at, updated_at
FROM telebase_prod_snapshot_20260710.evt_categories;

INSERT INTO telebase_v4_dev.evt_sections (
  id, user_id, name, literals, description, sort_order, access, color, bgcolor,
  icon, decor, seo, is_archived, is_default, created_at, updated_at
)
SELECT
  id, user_id, name, literals, description, sort_order, access, color, bgcolor,
  icon, decor, seo, is_archived, is_default, created_at, updated_at
FROM telebase_prod_snapshot_20260710.evt_sections;

INSERT INTO telebase_v4_dev.evt_tags (
  id, user_id, name, slug, color, bgcolor, is_system, sort_order,
  is_archived, created_at, updated_at
)
SELECT
  id, user_id, name, slug, color, bgcolor, is_system, sort_order,
  is_archived, created_at, updated_at
FROM telebase_prod_snapshot_20260710.evt_tags;

INSERT INTO telebase_v4_dev.evt_types (
  id, user_id, name, description, color, bgcolor, sort_order, icon,
  is_archived, is_default, created_at, updated_at
)
SELECT
  id, user_id, name, description, color, bgcolor, sort_order, icon,
  is_archived, is_default, created_at, updated_at
FROM telebase_prod_snapshot_20260710.evt_types;

INSERT INTO telebase_v4_dev.evt_events (
  id, name, user_id, type_id, format, metadata, language, code_language,
  section_id, category_id, project_id, exploiter_event_id, location, client,
  content, status, sort_order, access, comment_access, parent_id, root_id,
  relation_type, is_blurred, is_locked, is_pinned, occurred_at, created_at, updated_at
)
SELECT
  id, name, user_id, type_id, format, metadata, language, code_language,
  section_id, category_id, project_id, NULL, location, client,
  content, status, sort_order, access, comment_access, parent_id, root_id,
  relation_type, is_blurred, is_locked, is_pinned, setdate, created_at, updated_at
FROM telebase_prod_snapshot_20260710.evt_events;

INSERT INTO telebase_v4_dev.cnt_contents (
  id, user_id, source_module, source_id, field, kind, title, body_md, body_hash,
  locale, status, is_primary, sort_order, meta, created_at, updated_at, deleted_at
)
SELECT
  id, user_id, 'eventor', id, 'content', 'markdown', name, TRIM(content),
  SHA2(TRIM(content), 256), NULL, 1, 1, 0, NULL, created_at, updated_at, NULL
FROM telebase_prod_snapshot_20260710.evt_events
WHERE content IS NOT NULL AND TRIM(content) <> '';

INSERT INTO telebase_v4_dev.evt_event_tags (event_id, tag_id)
SELECT event_id, tag_id
FROM telebase_prod_snapshot_20260710.evt_event_tags;

INSERT INTO telebase_v4_dev.evt_embeds (
  id, event_id, user_id, url, provider, type, title, author, thumbnail_url,
  duration, meta, `order`, created_at, updated_at
)
SELECT
  id, event_id, user_id, url, provider, type, title, author, thumbnail_url,
  duration, meta, `order`, created_at, updated_at
FROM telebase_prod_snapshot_20260710.evt_embeds;

INSERT INTO telebase_v4_dev.evt_media (
  id, event_id, user_id, url, path, mime_type, size, width, height,
  sort_order, meta, created_at, updated_at
)
SELECT
  id, event_id, user_id, url, path, mime_type, size, width, height,
  sort_order, meta, created_at, updated_at
FROM telebase_prod_snapshot_20260710.evt_media;

INSERT INTO telebase_v4_dev.evt_starred (user_id, event_id, created_at, updated_at)
SELECT user_id, event_id, created_at, updated_at
FROM telebase_prod_snapshot_20260710.evt_starred;

INSERT INTO telebase_v4_dev.led_layers (
  id, user_id, name, type, parent_id, is_active, created_at, updated_at
)
SELECT id, user_id, name, type, parent_id, is_active, created_at, updated_at
FROM telebase_prod_snapshot_20260710.bud_layers;

INSERT INTO telebase_v4_dev.led_categories (
  id, user_id, parent_id, name, depth, path, sort_order, is_archived,
  created_at, updated_at
)
SELECT
  id, user_id, parent_id, name, depth, path, sort_order, is_archived,
  created_at, updated_at
FROM telebase_prod_snapshot_20260710.bud_categories;

INSERT INTO telebase_v4_dev.led_accounts (
  id, user_id, layer_id, name, literals, type, currency, opening_balance,
  color, sort_order, opened_at, closed_at, interest_rate, interest_start,
  is_archived, created_at, updated_at
)
SELECT
  id, user_id, layer_id, name, literals, type, currency, opening_balance,
  color, sort_order, opened_at, closed_at, interest_rate, interest_start,
  is_archived, created_at, updated_at
FROM telebase_prod_snapshot_20260710.bud_accounts;

INSERT INTO telebase_v4_dev.led_transaction_groups (
  id, user_id, name, is_disabled, color, created_at, updated_at
)
SELECT id, user_id, name, is_disabled, color, created_at, updated_at
FROM telebase_prod_snapshot_20260710.bud_transaction_groups;

INSERT INTO telebase_v4_dev.led_transactions (
  id, user_id, layer_id, account_id, target_account_id, group_id, category_id,
  original_transaction_id, flow_kind, amount, is_negative, occurred_at, month_key,
  title, note, status, is_disabled, is_pinned, sort_order, exploiter_event_id,
  cost_type, linked_entity_type, linked_entity_id, created_at, updated_at, deleted_at
)
SELECT
  id, user_id, layer_id, account_id, target_account_id, group_id, category_id,
  original_transaction_id, flow_kind, amount, is_negative, occurred_at, month_key,
  title, note, status, is_disabled, is_pinned, sort_order, NULL,
  NULL, linked_entity_type, linked_entity_id, created_at, updated_at, deleted_at
FROM telebase_prod_snapshot_20260710.bud_transactions;

INSERT INTO telebase_v4_dev.led_month_totals (
  id, user_id, layer_id, account_id, month_key, opening_balance, closing_balance,
  income_total, expense_total, transfer_in_total, transfer_out_total,
  adjustment_total, interest_total, tx_count, is_dirty, created_at, updated_at
)
SELECT
  id, user_id, layer_id, account_id, month_key, opening_balance, closing_balance,
  income_total, expense_total, transfer_in_total, transfer_out_total,
  adjustment_total, interest_total, tx_count, is_dirty, created_at, updated_at
FROM telebase_prod_snapshot_20260710.bud_month_totals;

INSERT INTO telebase_v4_dev.led_transaction_tags (transaction_id, tag_id)
SELECT transaction_id, tag_id
FROM telebase_prod_snapshot_20260710.bud_transaction_tags;

INSERT INTO telebase_v4_dev.stf_locations (
  id, user_id, name, parent_id, sort_order, is_archived,
  created_at, updated_at, deleted_at
)
SELECT
  id, user_id, name, parent_id, sort_order, is_archived,
  created_at, updated_at, deleted_at
FROM telebase_prod_snapshot_20260710.stf_locations;

INSERT INTO telebase_v4_dev.stf_things (
  id, user_id, entity_type, name, description, vendor, url, parent_id,
  category_id, current_location_id, current_status, serial_no, qty, unit,
  purchase_price, purchase_date, open_count, last_opened_at, is_archived,
  track_location, track_lifecycle, created_at, updated_at, deleted_at
)
SELECT
  id, user_id, entity_type, name, description, vendor, url, parent_id,
  category_id, current_location_id, current_status, serial_no, qty, unit,
  purchase_price, purchase_date, open_count, last_opened_at, is_archived,
  1, IF(entity_type = 'asset', 1, 0), created_at, updated_at, deleted_at
FROM telebase_prod_snapshot_20260710.stf_things;

INSERT INTO telebase_v4_dev.stf_register (
  id, user_id, thing_id, event_type, from_location_id, to_location_id, contact,
  return_expected, amount, note, details, status, priority, is_pinned,
  part_cost, labor_cost, time_self_min, time_service_min, occurred_at,
  created_at, updated_at
)
SELECT
  id, user_id, thing_id, event_type, from_location_id, to_location_id, contact,
  return_expected, amount, note, NULL, NULL, NULL, 0,
  0, 0, 0, 0, occurred_at, created_at, updated_at
FROM telebase_prod_snapshot_20260710.stf_register;

INSERT INTO telebase_v4_dev.stf_expenses (
  id, user_id, thing_id, register_id, transaction_id, amount, note,
  occurred_at, created_at, updated_at
)
SELECT
  id, user_id, thing_id, register_id, transaction_id, amount, note,
  occurred_at, created_at, updated_at
FROM telebase_prod_snapshot_20260710.stf_expenses;

SET FOREIGN_KEY_CHECKS = 1;
