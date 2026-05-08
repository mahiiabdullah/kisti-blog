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
import { useCallback, useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Bold, Italic, Underline as UnderlineIcon, Quote, Highlighter,
  List, ListOrdered, Link as LinkIcon, ImagePlus, AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, MoreHorizontal, X
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  className?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = "Write your content...", dir = "ltr", className = "" }: RichTextEditorProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMore, setShowMore] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
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
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose-editor min-h-[400px] outline-none px-4 py-3 ${className}`,
        dir,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
          <Highlighter className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <Quote className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

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

        <ToolButton onClick={setLink} active={editor.isActive("link")} title="Link">
          <LinkIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={insertImage} title="Insert Image">
          <ImagePlus className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo2 className="w-4 h-4" />
        </ToolButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Dynamic Popups */}
      {editor && (
        <BubbleMenu editor={editor} className="flex items-center gap-0.5 bg-background border border-border shadow-md rounded-md p-1">
          {showMore ? (
            <>
              <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
                <Bold className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
                <Italic className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
                <UnderlineIcon className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
                <Highlighter className="w-4 h-4" />
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
              <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
                <List className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
                <ListOrdered className="w-4 h-4" />
              </ToolButton>

              <div className="w-px h-4 bg-border mx-1" />

              <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
                <AlignLeft className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
                <AlignCenter className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
                <AlignRight className="w-4 h-4" />
              </ToolButton>

              <div className="w-px h-4 bg-border mx-1" />

              <ToolButton onClick={setLink} active={editor.isActive("link")} title="Link">
                <LinkIcon className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={insertImage} title="Insert Image">
                <ImagePlus className="w-4 h-4" />
              </ToolButton>
              
              <div className="w-px h-4 bg-border mx-1" />

              <ToolButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
                <Undo2 className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
                <Redo2 className="w-4 h-4" />
              </ToolButton>

              <div className="w-px h-4 bg-border mx-1" />

              <ToolButton onClick={() => setShowMore(false)} title="Less Options">
                <X className="w-4 h-4 text-muted-foreground" />
              </ToolButton>
            </>
          ) : (
            <>
              <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
                <Bold className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
                <Italic className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
                <UnderlineIcon className="w-4 h-4" />
              </ToolButton>
              <div className="w-px h-4 bg-border mx-1" />
              <ToolButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
                <Highlighter className="w-4 h-4" />
              </ToolButton>
              <ToolButton onClick={setLink} active={editor.isActive("link")} title="Link">
                <LinkIcon className="w-4 h-4" />
              </ToolButton>
              <div className="w-px h-4 bg-border mx-1" />
              <ToolButton onClick={() => setShowMore(true)} title="More Options">
                <MoreHorizontal className="w-4 h-4" />
              </ToolButton>
            </>
          )}
        </BubbleMenu>
      )}

      {editor && (
        <FloatingMenu editor={editor} className="flex items-center gap-0.5 bg-background border border-border shadow-md rounded-md p-1 ml-4">
          <ToolButton onClick={insertImage} title="Insert Image">
            <ImagePlus className="w-4 h-4" />
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
        </FloatingMenu>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Editor styles */}
      <style jsx global>{`
        .prose-editor {
          font-size: 1rem;
          line-height: 1.75;
        }
        .prose-editor p { margin: 0.75em 0; }
        .prose-editor h2 { font-size: 1.5em; font-weight: 700; margin: 1.5em 0 0.5em; }
        .prose-editor h3 { font-size: 1.25em; font-weight: 600; margin: 1.25em 0 0.5em; }
        .prose-editor h4 { font-size: 1.1em; font-weight: 600; margin: 1em 0 0.5em; }
        .prose-editor blockquote {
          border-left: 3px solid hsl(var(--accent));
          padding-left: 1em;
          margin: 1em 0;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        .prose-editor ul { list-style: disc; padding-left: 1.5em; margin: 0.75em 0; }
        .prose-editor ol { list-style: decimal; padding-left: 1.5em; margin: 0.75em 0; }
        .prose-editor li { margin: 0.25em 0; }
        .prose-editor mark { background: hsl(var(--accent) / 0.2); padding: 0.1em 0.3em; border-radius: 2px; }
        .prose-editor a, .editor-link { color: hsl(var(--accent)); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
        .prose-editor img, .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1em 0;
        }
        .prose-editor p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
