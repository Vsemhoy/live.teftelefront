import { useMemo } from 'react';
import { Box } from '@mantine/core';
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  diffSourcePlugin,
  headingsPlugin,
  InsertCodeBlock,
  InsertTable,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
} from '@mdxeditor/editor';

const CODE_BLOCK_LANGUAGES = {
  js: 'JavaScript',
  ts: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  py: 'Python',
  php: 'PHP',
  java: 'Java',
  cs: 'C#',
  sql: 'SQL',
  bash: 'Bash',
  powershell: 'PowerShell',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  yaml: 'YAML',
  markdown: 'Markdown',
  text: 'Text',
};

const buildPlugins = (toolbarClassName) => [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  markdownShortcutPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
  codeMirrorPlugin({ codeBlockLanguages: CODE_BLOCK_LANGUAGES }),
  diffSourcePlugin({ viewMode: 'rich-text' }),
  toolbarPlugin({
    toolbarClassName,
    toolbarContents: () => (
      <>
        <UndoRedo />
        <BoldItalicUnderlineToggles />
        <BlockTypeSelect />
        <CodeToggle />
        <CreateLink />
        <ListsToggle />
        <InsertTable />
        <ConditionalContents
          options={[
            {
              when: (editor) => editor?.editorType === 'codeblock',
              contents: () => <ChangeCodeMirrorLanguage />,
            },
            {
              fallback: () => <InsertCodeBlock />,
            },
          ]}
        />
      </>
    ),
  }),
];

export const MdEditor = ({
  value,
  onChange,
  placeholder = 'Write your content...',
  editorKey,
  className = 'md-editor-surface md',
  contentEditableClassName = 'md-editor-contenteditable',
  toolbarClassName = 'md-editor-toolbar',
}) => {
  const plugins = useMemo(() => buildPlugins(toolbarClassName), [toolbarClassName]);

  return (
    <Box className={className}>
      <MDXEditor
        key={editorKey}
        overlayContainer={typeof document !== 'undefined' ? document.body : undefined}
        markdown={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        contentEditableClassName={contentEditableClassName}
        plugins={plugins}
      />
    </Box>
  );
};
