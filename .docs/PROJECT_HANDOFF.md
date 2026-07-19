---
document_type: codex_project_handoff
schema_version: 1
project: teftele
snapshot_date: 2026-07-19
timezone: Europe/Moscow
status: implementation_in_progress
frontend_root: C:\DEV\JS\telefront
backend_root: C:\DEV\PHP\OSPanel_651\home\teleback
database:
  engine: MariaDB
  version: "11.8"
  name: telebase_v6_dev
authoritative_files:
  factor_spec: C:\DEV\PHP\OSPanel_651\home\teleback\.docs\FACTOR_MODULE.md
  linked_modules_migration: C:\DEV\PHP\OSPanel_651\home\teleback\database\migrations\2026_07_19_000001_prepare_linked_modules.php
do_not_delete:
  - C:\DEV\JS\telefront
  - C:\DEV\PHP\OSPanel_651\home\teleback
  - telebase_v6_dev
  - SQL dumps
  - .env files
---

# TEFTELE project handoff

## Bootstrap protocol

1. Read this file completely.
2. Inspect both repositories and Git status without modifying anything.
3. Inspect the linked-modules migration and verify php artisan migrate:status.
4. Verify apply_patch with the real sticky-header change below.
5. Compare this handoff with actual code and schema. Files win in factual conflicts.
6. Publish a short staged plan and continue from the backend foundation.

## Safety constraints

- Never use git reset --hard, destructive checkout, or mass deletion without approval.
- Preserve unrelated and uncommitted user changes.
- Never expose passwords, tokens, .env values, Factor values, or DB credentials.
- Confirm destructive DB operations target local telebase_v6_dev.
- Use transactions for cross-module writes and cascading deletes.
- Do not introduce a second parallel data layer.
- Do not delete Codex/ChatGPT state before an exact read-only audit and approval.

## Runtime incident

~~~yaml
surface: ChatGPT desktop on native Windows
error: windows unelevated restricted-token sandbox cannot enforce split writable root sets directly
trigger:
  - telefront writable root
  - automatically attached .codex/visualizations writable root
effects:
  apply_patch: blocked before reading target file
  shell_read: works
  one_shot_escalation: works
  apply_patch_escalation: unavailable
recovery:
  - back up projects and this file
  - audit and clean desktop app state
  - create a fresh Codex project with only telefront
  - add backend after patcher verification
  - use WSL2 if native Windows sandbox remains broken
~~~

## Technology and modules

~~~yaml
frontend:
  framework: React 19
  build: Vite 6
  ui: Mantine
  state: Zustand
  server_state: TanStack Query
  routing: React Router
  local_database: Dexie
backend:
  framework: Laravel
  ids: ULID
  auth: JWT
  database: MariaDB
modules_existing: [home, eventor, ledger, stuffer, exploiter, contactor, booker]
modules_new: [factor]
modules_shadow: [timer]
~~~

## Completed work

### Database import

~~~yaml
dump: host1334262_teftele2026v6.sql
target: telebase_v6_dev
status: completed
verification:
  tables: 37
  migration_history_rows: 35
  eventor_events: 2072
  ledger_transactions: 577
  stuffer_things: 13
  exploiter_events: 24
  content_rows: 1701
note: localhost import required SSL disabled due to SEC_E_NO_CREDENTIALS
~~~

### Linked-modules migration

File: C:\DEV\PHP\OSPanel_651\home\teleback\database\migrations\2026_07_19_000001_prepare_linked_modules.php

~~~yaml
file_created: true
application_status: verify
expected_changes:
  stf_things.last_category_id: per-thing Eventor category default
  stf_register.performer_contact_id: performer link to Contactor
  evt_events.thing_id: Eventor link to Staffer thing
  ctr_contact_origins: universal contact origin tracking
~~~

Do not assume it ran. Verify its contents, migration status, and actual schema.

## Domain ownership

~~~yaml
eventor: thoughts, research, events, Markdown content
stuffer: things and lifecycle context
exploiter: work, fuel, readings, incidents, checks
ledger: money and accounts
contactor: people, organizations, performers
factor: identifiers, values, commands, code, SVG
timer: shared time bank without standalone MVP UI
~~~

Rule: modules own their data and link by identifiers. Do not copy an Eventor entry into Exploiter.

## Global expert mode

~~~yaml
existing: true
toggle: double click active module name in AppHeader
persist_key: teftele-expert
factor:
  mode_off: exclude is_expert from list, search, and API output
  mode_on: include and mark is_expert; allow editing Expert only
~~~

is_expert and is_sensitive are independent.

## Exploiter redesign

| Type | Status | Priority | Empty title fallback |
|---|---:|---:|---|
| Work | yes | yes | user title |
| Fuel | no | no | resource label |
| Reading | no | no | metric label |
| Incident | no | no | Incident |
| Check | no | no | Check |
| Note | remove | remove | migrate/create in Eventor |

Backend must enforce title fallback and store a human-readable label.

~~~yaml
delete:
  add: true
  confirmation: required
  fuel_rule: no orphan Ledger transaction
fuel:
  account_selection: user selectable
  current_issue: phantom/hard-coded account
performer:
  link: stf_register.performer_contact_id
  source: Contactor
  history: preserve snapshots where required
content:
  editor: Markdown
  raw_mode: true
future_filter:
  persist_key: exploiter-ui
  pinned_bypasses_filter: true
monthly_separator:
  single_line: true
  no_wrap: true
  total_aligned_right: true
~~~

Desired UI:

~~~text
Июль 2026 ───────────────────────── Total 48 900 ₽
~~~

## Eventor / Staffer / Exploiter link

~~~yaml
eventor:
  optional_thing_field: evt_events.thing_id
  category_selected_by_user: true
thing:
  category_default: stf_things.last_category_id
  fallback_category: Stuff
  update_default_after_successful_event_save: true
rules:
  - last_category_id is only a UI default
  - actual category remains on the Eventor entry
  - creation works from Eventor and preselected Exploiter thing
  - inaccessible defaults fall back to Stuff
  - Exploiter Note is removed after migration
~~~

## Factor module

Goal: find, read, or copy a VIN, phone, account number, Docker command, host, code sample, number, or SVG within seconds.

~~~yaml
fct_facts:
  fields:
    - id
    - user_id
    - label
    - value
    - format
    - language
    - unit
    - context
    - search_aliases
    - kind
    - display_mode
    - is_sensitive
    - is_expert
    - valid_from
    - valid_to
    - is_pinned
    - sort_order
    - created_at
    - updated_at
  formats: [text, markdown, code, command, number, svg]
~~~

~~~yaml
search:
  autofocus: true
  live_results: true
  enter_opens_first: true
  fields: [label, value, context, tags, search_aliases]
viewer:
  short_text: large responsive typography
  copy_button: convenient and immediate
  sensitive_default: masked
  recent_and_pinned: true
security:
  public_route: forbidden
  log_values: forbidden
  svg:
    store_original: true
    render_sanitized_only: true
~~~

External modules own M:N satellite tables:

~~~text
stf_thing_facts(thing_id, fact_id)
cnt_contact_facts(contact_id, fact_id)
stf_register_facts(register_id, fact_id)
evt_event_facts(event_id, fact_id)
led_transaction_facts(transaction_id, fact_id)
fct_fact_tags(fact_id, tag)
~~~

Do not use a single factor_fact_id. For MVP, tags are strings in fct_fact_tags; do not combine JSON tags with a separate dictionary.

## Home and application shell

~~~yaml
routes:
  "/": module tile launcher
  "/home": existing combined feed
launcher_tiles: [eventor, ledger, stuffer, exploiter, contactor, booker, factor, feed]
navigation:
  Home: "/"
  Feed: "/home"
~~~

Pending target: C:\DEV\JS\telefront\src\app\global.css

~~~css
.app-header {
  position: sticky;
  top: 0;
  z-index: 250;
}
~~~

## Timer shadow module

~~~yaml
sys_timer_entries:
  fields:
    - id
    - started_at
    - ended_at
    - duration_min
    - entry_type
    - time_type
    - source_module
    - source_id
    - sort_order
    - note
    - user_id
entry_type:
  exploiter: manual
  future_tasker: timer
  eventor: interval
rollup_cache:
  - stf_register.time_self_min
  - stf_register.time_service_min
~~~

Rollup fields are not the source of truth.

## Implementation order

1. Back up repositories and DB; inspect Git status.
2. Verify prepare_linked_modules.php, migration status, and schema.
3. Complete backend relationships and indexes without duplicate fields.
4. Implement Eventor-to-thing, performer-to-Contactor, and Fuel-to-Ledger account.
5. Redesign Exploiter fields, titles, delete, Markdown, and monthly total.
6. Move Feed to /home, create launcher at /, and apply sticky header.
7. Implement Factor backend: schema, search, expert/sensitive filters, tags, links.
8. Implement Factor frontend with search-first UX and safe viewer.
9. Migrate Exploiter Note into Eventor and verify no duplicates.
10. Run migrations/tests, frontend build, and smoke tests.

## Clean reinstall protocol

~~~yaml
before_delete:
  - copy this file outside .codex and AppData
  - back up both repositories
  - back up .env files
  - back up SQL dumps and database
  - export config.toml, credentials, skills, and plugins if needed
audit_required:
  - identify Store, Classic, or new desktop package
  - list exact app directories and sizes
  - distinguish cache, history, config, credentials, and plugins
delete_only_after_confirmation: true
never_delete:
  - C:\DEV
  - OSPanel
  - project repositories
  - database dumps
reinstall:
  - install current desktop client
  - select Codex
  - create project with only telefront
  - verify apply_patch
  - add backend after verification or use WSL2
~~~

## Acceptance criteria

~~~yaml
acceptance:
  - apply_patch works without split writable root sets
  - both repositories are readable and Git status is known
  - linked migration status is known
  - sticky header patch is applied
  - frontend build passes
  - backlog is reconstructed without another architecture interview
  - repositories, .env, dumps, and database remain intact
~~~

## Bootstrap prompt

~~~text
Работаем над большим обновлением TEFTELE.

Frontend: C:\DEV\JS\telefront
Backend: C:\DEV\PHP\OSPanel_651\home\teleback
Контекст: полностью прочитай .docs\PROJECT_HANDOFF.md.

Сначала:
1) проинспектируй оба репозитория и git status, ничего не удаляя;
2) проверь database/migrations/2026_07_19_000001_prepare_linked_modules.php;
3) проверь php artisan migrate:status и фактическую схему;
4) проверь apply_patch реальным sticky-header изменением;
5) составь короткий этапный план;
6) продолжи с backend-фундамента.

Файлы и схема являются источником истины при factual-конфликте.
Не удаляй проекты, БД, дампы и незакоммиченные изменения.
Значения Factor секретны и не должны попадать в логи.
~~~
