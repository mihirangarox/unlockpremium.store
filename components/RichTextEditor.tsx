import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    Youtube as YoutubeIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Table as TableIcon,
    Trash2,
    Plus,
    Minus
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const addImage = useCallback(() => {
        const url = window.prompt('URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const addYoutubeVideo = useCallback(() => {
        const url = window.prompt('Enter YouTube URL');
        if (url) {
            editor.commands.setYoutubeVideo({
                src: url,
            });
        }
    }, [editor]);

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    return (
        <div className="flex flex-col gap-2 mb-4 bg-gray-800 p-2 rounded-t-lg border-b border-gray-700">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('bold') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Bold"
                >
                    <Bold size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('italic') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Italic"
                >
                    <Italic size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('underline') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Underline"
                >
                    <UnderlineIcon size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('strike') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Strikethrough"
                >
                    <Strikethrough size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('code') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Code"
                >
                    <Code size={18} />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Heading 1"
                >
                    <Heading1 size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Heading 2"
                >
                    <Heading2 size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Heading 3"
                >
                    <Heading3 size={18} />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Align Left"
                >
                    <AlignLeft size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Align Center"
                >
                    <AlignCenter size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Align Right"
                >
                    <AlignRight size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Justify"
                >
                    <AlignJustify size={18} />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('bulletList') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Bullet List"
                >
                    <List size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('orderedList') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Ordered List"
                >
                    <ListOrdered size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('blockquote') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Blockquote"
                >
                    <Quote size={18} />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

                <button
                    type="button"
                    onClick={setLink}
                    className={`p-1.5 rounded hover:bg-gray-700 transition ${editor.isActive('link') ? 'bg-gray-700 text-indigo-400' : 'text-gray-300'}`}
                    title="Link"
                >
                    <LinkIcon size={18} />
                </button>
                <button
                    type="button"
                    onClick={addImage}
                    className="p-1.5 rounded hover:bg-gray-700 transition text-gray-300"
                    title="Image"
                >
                    <ImageIcon size={18} />
                </button>
                <button
                    type="button"
                    onClick={addYoutubeVideo}
                    className="p-1.5 rounded hover:bg-gray-700 transition text-gray-300"
                    title="YouTube"
                >
                    <YoutubeIcon size={18} />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-1 self-center" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    className="p-1.5 rounded hover:bg-gray-700 transition text-gray-300 disabled:opacity-50"
                    title="Undo"
                >
                    <Undo size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    className="p-1.5 rounded hover:bg-gray-700 transition text-gray-300 disabled:opacity-50"
                    title="Redo"
                >
                    <Redo size={18} />
                </button>
            </div>
            {/* Table Controls */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-700 transition text-gray-300 text-sm"
                    title="Insert Table"
                >
                    <TableIcon size={16} /> <span className="hidden sm:inline">Insert</span>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    disabled={!editor.can().chain().focus().addColumnBefore().run()}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-700 transition text-gray-300 disabled:opacity-50 text-sm"
                    title="Add Column Before"
                >
                    <Plus size={14} /> Col Before
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    disabled={!editor.can().chain().focus().addColumnAfter().run()}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-700 transition text-gray-300 disabled:opacity-50 text-sm"
                    title="Add Column After"
                >
                    <Plus size={14} /> Col After
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    disabled={!editor.can().chain().focus().deleteColumn().run()}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-700 transition text-red-400 disabled:opacity-50 text-sm"
                    title="Delete Column"
                >
                    <Minus size={14} /> Col
                </button>

                <div className="w-px h-5 bg-gray-700 mx-1 self-center" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    disabled={!editor.can().chain().focus().addRowBefore().run()}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-700 transition text-gray-300 disabled:opacity-50 text-sm"
                    title="Add Row Before"
                >
                    <Plus size={14} /> Row Before
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    disabled={!editor.can().chain().focus().addRowAfter().run()}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-700 transition text-gray-300 disabled:opacity-50 text-sm"
                    title="Add Row After"
                >
                    <Plus size={14} /> Row After
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    disabled={!editor.can().chain().focus().deleteRow().run()}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-700 transition text-red-400 disabled:opacity-50 text-sm"
                    title="Delete Row"
                >
                    <Minus size={14} /> Row
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    disabled={!editor.can().chain().focus().deleteTable().run()}
                    className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-700 transition text-red-500 disabled:opacity-50 text-sm ml-auto"
                    title="Delete Table"
                >
                    <Trash2 size={16} /> <span className="hidden sm:inline">Table</span>
                </button>
            </div>
        </div>
    );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, editable = true }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Youtube.configure({
                controls: false,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: 'Write something amazing...',
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] text-gray-300 selection:bg-indigo-500/30 selection:text-white',
            },
        },
    });

    return (
        <div className="rich-text-editor bg-gray-900 border border-gray-600 rounded-md overflow-hidden">
            {editable && <MenuBar editor={editor} />}
            <div className="p-4 overflow-x-auto">
                <EditorContent editor={editor} />
            </div>
            <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6b7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
        }
        .ProseMirror iframe {
            width: 100%;
            aspect-ratio: 16 / 9;
            border-radius: 0.5rem;
        }
        .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        /* Table Styles */
        .ProseMirror table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
            margin: 0;
            overflow: hidden;
            border-radius: 0.5rem;
            border: 1px solid #374151;
        }
        .ProseMirror table td,
        .ProseMirror table th {
            min-width: 1em;
            border: 1px solid #374151;
            padding: 0.75rem 1rem;
            vertical-align: top;
            box-sizing: border-box;
            position: relative;
        }
        .ProseMirror table th {
            font-weight: bold;
            text-align: left;
            background-color: #1f2937;
            color: #f3f4f6;
        }
        .ProseMirror table td {
            background-color: #111827;
        }
        
        .ProseMirror table .column-resize-handle {
            background-color: #6366f1;
            bottom: -2px;
            position: absolute;
            right: -2px;
            pointer-events: none;
            top: 0;
            width: 4px;
        }
        
        .ProseMirror table p {
            margin: 0;
            line-height: normal;
        }
      `}</style>
        </div>
    );
};

export default RichTextEditor;
