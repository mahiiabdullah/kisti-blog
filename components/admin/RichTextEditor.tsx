"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Node, Mark, mergeAttributes } from "@tiptap/core";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Bold, Italic, Underline as UnderlineIcon, Quote, Highlighter,
  List, ListOrdered, Link as LinkIcon, ImagePlus, AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, X, Strikethrough, Minus, Code, Code2,
  Table as TableIcon, Save, Type, LayoutTemplate, BookMarked
} from "lucide-react";

// ── Font Size Mark (pure @tiptap/core, no external packages) ───────────
const FontSizeMark = Mark.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) => attrs.size ? { style: `font-size: ${attrs.size}` } : {},
      },
    };
  },
  parseHTML() { return [{ tag: "span[style*='font-size']" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().focus().setMark("fontSize", { size }).run(),
      unsetFontSize: () => ({ chain }: any) =>
        chain().focus().unsetMark("fontSize").run(),
    } as any;
  },
});

// ── Callout / Concept-box Node ───────────────────────────────────────────
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() { return [{ tag: "div.callout" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "callout" }), 0];
  },
  addCommands() {
    return {
      insertCallout: () => ({ commands }: any) =>
        commands.insertContent({ type: "callout", content: [{ type: "paragraph" }] }),
      toggleCallout: () => ({ state, commands }: any) => {
        const { from } = state.selection;
        const node = state.doc.nodeAt(from);
        if (node?.type.name === "callout") return commands.lift("callout");
        return commands.wrapIn("callout");
      },
    } as any;
  },
});

const FONT_SIZES = [
  { label: "ছোট", value: "0.85rem" },
  { label: "স্বাভাবিক", value: "" },
  { label: "মাঝারি", value: "1.15rem" },
  { label: "বড়", value: "1.35rem" },
  { label: "শিরোনাম", value: "1.6rem" },
];

// Bengali numerals for section numbering
const toBn = (n: number) => n.toString().replace(/\d/g, (x) => "\u09e6\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef"[+x]);


interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  className?: string;
  draftKey?: string; // localStorage key for autosave
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write your content...",
  dir = "ltr",
  className = "",
  draftKey,
}: RichTextEditorProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMore, setShowMore] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fontSizeOpen, setFontSizeOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: {},
        codeBlock: {},
        strike: {},
        horizontalRule: {},
      }),
      Image.configure({
        HTMLAttributes: { class: "editor-image" },
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      Highlight.configure({ multicolor: false }),
      FontSizeMark,
      Callout,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose-editor min-h-[400px] outline-none px-4 py-3 ${className}`,
        dir,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      // Autosave to localStorage
      if (draftKey) {
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
          localStorage.setItem(draftKey, html);
          setLastSaved(new Date());
        }, 1000);
      }
    },
  });

  // Sync content from parent when it changes externally (e.g. language tab switch)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const uploadImage = useCallback(async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `images/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    editor?.chain().focus().setImage({ src: data.publicUrl }).run();
    toast.success("Image inserted");
  }, [editor, user]);

  const insertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = "";
  }, [uploadImage]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const insertSection = useCallback(() => {
    if (!editor) return;
    // Count existing h2 headings to determine next section number
    const html = editor.getHTML();
    const matches = html.match(/<h2/g);
    const nextNum = (matches ? matches.length : 0) + 1;
    const bnNum = toBn(nextNum);
    editor.chain().focus()
      .insertContent(`<h2 id="section-${nextNum}"><span class="section-heading-num">${bnNum}</span> শিরোনাম লিখুন</h2><p></p>`)
      .run();
  }, [editor]);


  const restoreDraft = useCallback(() => {
    if (!draftKey) return;
    const saved = localStorage.getItem(draftKey);
    if (saved && editor) {
      editor.commands.setContent(saved, { emitUpdate: true });
      toast.success("Draft restored.");
    }
  }, [draftKey, editor]);

  if (!editor) return null;

  const ToolButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-sm transition-colors ${active ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-border rounded-sm bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 shadow-sm">
        {/* Text formatting */}
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
          <Highlighter className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Headings */}
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <span className="text-xs font-bold px-1">H2</span>
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <span className="text-xs font-bold px-1">H3</span>
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="Heading 4">
          <span className="text-xs font-bold px-1">H4</span>
        </ToolButton>
        {/* Section heading (numbered chapter) */}
        <ToolButton onClick={insertSection} active={false} title="সেকশন / অধ্যায় যোগ করুন">
          <span className="flex items-center gap-0.5">
            <BookMarked className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">§</span>
          </span>
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Block elements */}
        <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <Quote className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
          <Code className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
          <Code2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Alignment */}
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <AlignRight className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Font size */}
        <div className="relative">
          <button
            type="button"
            title="Font Size"
            onClick={() => setFontSizeOpen((v) => !v)}
            className="flex items-center gap-1 p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">আকার</span>
          </button>
          {fontSizeOpen && (
            <div className="absolute top-full left-0 mt-1 bg-background border border-border shadow-lg z-50 min-w-[110px]">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => {
                    if (f.value) (editor.chain().focus() as any).setFontSize(f.value).run();
                    else (editor.chain().focus() as any).unsetFontSize().run();
                    setFontSizeOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors font-bn"
                  style={f.value ? { fontSize: f.value } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Callout box */}
        <ToolButton
          onClick={() => (editor.chain().focus() as any).insertCallout().run()}
          active={editor.isActive("callout")}
          title="Callout / Concept Box"
        >
          <LayoutTemplate className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Media & Links */}
        <ToolButton onClick={setLink} active={editor.isActive("link")} title="Insert Link">
          <LinkIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={insertImage} title="Insert Image">
          <ImagePlus className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={insertTable} title="Insert Table">
          <TableIcon className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* History */}
        <ToolButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo2 className="w-4 h-4" />
        </ToolButton>

        {/* Autosave status */}
        {draftKey && (
          <div className="ml-auto flex items-center gap-2">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground font-en-sans flex items-center gap-1">
                <Save className="w-3 h-3" />
                Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={restoreDraft}
              title="Restore saved draft"
              className="text-[10px] text-accent hover:underline font-en-sans px-2 py-1 border border-accent/30 rounded-sm"
            >
              খসড়া পুনরুদ্ধার
            </button>
          </div>
        )}
      </div>

      {/* Table controls (contextual) */}
      {editor.isActive("table") && (
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-secondary/30 border-b border-border text-xs font-en-sans">
          <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-0.5 rounded hover:bg-secondary border border-border/60">+ Row Before</button>
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-0.5 rounded hover:bg-secondary border border-border/60">+ Row After</button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-0.5 rounded hover:bg-secondary border border-border/60 text-destructive">− Row</button>
          <button type="button" onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-0.5 rounded hover:bg-secondary border border-border/60">+ Col Before</button>
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-0.5 rounded hover:bg-secondary border border-border/60">+ Col After</button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-0.5 rounded hover:bg-secondary border border-border/60 text-destructive">− Col</button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-0.5 rounded hover:bg-secondary border border-border/60 text-destructive">Delete Table</button>
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Bubble Menu */}
      {editor && (
        <BubbleMenu editor={editor} className="flex items-center gap-0.5 bg-background border border-border shadow-md rounded-md p-1">
          <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
            <UnderlineIcon className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strike">
            <Strikethrough className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
            <Highlighter className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={setLink} active={editor.isActive("link")} title="Link">
            <LinkIcon className="w-4 h-4" />
          </ToolButton>
        </BubbleMenu>
      )}

      {/* Floating Menu */}
      {editor && (
        <FloatingMenu editor={editor} className="flex items-center gap-0.5 bg-background border border-border shadow-md rounded-md p-1 ml-4">
          <ToolButton onClick={insertImage} title="Insert Image">
            <ImagePlus className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={insertTable} title="Insert Table">
            <TableIcon className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <span className="text-xs font-bold px-1">H2</span>
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <span className="text-xs font-bold px-1">H3</span>
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
            <Quote className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="w-4 h-4" />
          </ToolButton>
        </FloatingMenu>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
