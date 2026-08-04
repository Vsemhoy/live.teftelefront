# Booker Module

Booker is a document engine for books, pages, and typed content blocks. It should not depend on Contentor: Booker needs its own document structure, block identity, and versioning model.

## Core Idea

Booker owns the document hierarchy:

```text
space -> book -> page -> block group -> block version
```

Stable links should point to semantic block groups, not to a single mutable content row. A concrete block version can also be addressed when historical precision is needed.

```text
/booker/:space/:book/:page/:blockGroupId
/booker/:space/:book/:page/:blockGroupId/:blockVersionId
```

The first route opens the current master version. The second route opens a specific historical version.

## Storage Model

Recommended tables:

```text
bkr_spaces
bkr_books
bkr_pages
bkr_block_groups
bkr_blocks
```

### Books

```text
bkr_books
  id
  space_id
  user_id
  title
  description
  structure_mode enum('tree', 'flat') default 'tree'
  visibility enum('private', 'friends', 'registered', 'public') default 'private'
  cover_color
  export_settings json nullable
  sort_order
  is_archived
  created_at
  updated_at
```

`structure_mode` controls how pages are organized and exported:

- `tree`: documentation-style nested pages.
- `flat`: linear page list, useful for manuals, checklists, regulations, and simple PDF export.

### Pages

```text
bkr_pages
  id
  book_id
  parent_id nullable
  title
  slug
  visibility enum('private', 'friends', 'registered', 'public') default 'private'
  sort_order
  is_archived
  created_at
  updated_at
```

For `tree` books, `parent_id` and `sort_order` define the page tree.

For `flat` books, `parent_id` is ignored or kept `null`; pages are ordered only by `sort_order`.

### Block Groups

`bkr_block_groups` store stable block identity and placement on a page.

```text
bkr_block_groups
  id
  page_id
  type
  role enum('content', 'note', 'source', 'todo', 'ai_response', 'layout') default 'content'
  master_block_id nullable
  visibility enum('private', 'friends', 'registered', 'public') default 'private'
  is_hidden_by_default boolean default false
  sort_order
  created_by
  created_at
  updated_at
```

`id` is the stable public block identifier. `master_block_id` points to the active version.

### Block Versions

`bkr_blocks` store immutable or versioned block content.

```text
bkr_blocks
  id
  group_id
  version_number
  title text nullable
  content longtext nullable
  payload json nullable
  status enum('draft', 'published', 'archived') default 'draft'
  created_by
  created_at
  published_at nullable
```

Visibility belongs to the block group. Version state belongs to the block version.

## Visibility

Visibility is set independently on:

- book
- page
- block group

Effective access is calculated as a cascade:

```text
book allows
+ page allows
+ block group allows
+ block version status is publishable
```

A public block inside a private book is still private for external users.

Block versions should use `status` rather than their own visibility. This allows a public block group to have private drafts.

## Block Types

Initial block types:

```text
markdown
excalidraw
code
callout
divider
embed
checklist
file
image
```

`image` can be implemented later.

## Markup Blocks

Markup blocks are regular block groups with special `role` values. They can be inserted anywhere on a page, have their own visibility, and are private/hidden by default.

Required markup roles:

```text
note        -> type markdown, role note
source      -> type markdown, role source
todo        -> type checklist, role todo
ai_response -> type markdown, role ai_response
```

Default behavior:

```text
visibility = private
is_hidden_by_default = true
```

Markup block title should be a long textarea, not a short input. In page view, title is shown as one line with ellipsis. Content preview is also truncated. Double click opens a fullscreen editor.

## Versioning

Block versioning is native to Booker.

Creating a new content block creates:

1. A new `bkr_block_groups` row.
2. The first `bkr_blocks` version.
3. `bkr_block_groups.master_block_id` pointing to that first version.

Editing can create a new `bkr_blocks` version instead of mutating the old one. Publishing a version updates `master_block_id`.

This keeps links stable while preserving history.

## Page Versioning

Do not implement full page versioning first. It is more complex and can be added later through snapshots:

```text
bkr_page_snapshots
  id
  page_id
  title
  block_map json
  created_by
  created_at
```

`block_map` stores which block version was used by each block group at snapshot time.

## Collaboration

The model should leave room for collaborative editing:

```text
bkr_blocks.created_by
bkr_blocks.status
bkr_blocks.published_at
```

Future fields may include:

```text
locked_by
locked_at
reviewed_by
approved_at
```

## Export

Booker should support export later, especially PDF.

Export behavior depends on `structure_mode`:

- `tree`: recursive export with nested sections and table of contents.
- `flat`: linear export by page `sort_order`.

Book export settings can live in `bkr_books.export_settings`:

```json
{
  "include_private_blocks": false,
  "include_markup_blocks": false,
  "page_breaks": "page",
  "toc": true
}
```

