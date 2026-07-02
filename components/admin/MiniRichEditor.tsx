"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useCallback } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, X } from "lucide-react";

interface MiniRichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function MiniRichEditor({
  content,
  onChange,
  placeholder = "Write here…",
  rows = 2,
}: MiniRichEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose-editor min-h-[${rows * 2}rem] outline-none px-3 py-2 text-sm font-bn leading-relaxed`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (e.g. loading post)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const existing = editor.getAttributes("link").href ?? "";
    setLinkUrl(existing);
    setShowLinkInput(true);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-border bg-background relative">
      {/* BubbleMenu — appears on text selection */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100, placement: "top-start" }}
      >
        <div className="flex items-center bg-popover border border-border shadow-lg divide-x divide-border">
          {showLinkInput ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                autoFocus
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); applyLink(); }
                  if (e.key === "Escape") { setShowLinkInput(false); }
                }}
                placeholder="https://…"
                className="text-xs border-none outline-none bg-transparent w-48 font-en-sans"
              />
              <button onClick={applyLink} className="text-xs px-2 py-0.5 bg-accent text-white rounded-sm">OK</button>
              <button onClick={() => setShowLinkInput(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <>
              <ToolBtn
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </ToolBtn>
              <ToolBtn
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </ToolBtn>
              <ToolBtn
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Underline"
              >
                <UnderlineIcon className="w-3.5 h-3.5" />
              </ToolBtn>
              <ToolBtn
                active={editor.isActive("link")}
                onClick={openLinkInput}
                title="Link"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </ToolBtn>
              {editor.isActive("link") && (
                <ToolBtn
                  active={false}
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  title="Remove link"
                >
                  <X className="w-3.5 h-3.5" />
                </ToolBtn>
              )}
              {/* Superscript for reference numbers */}
              <button
                onClick={() => {
                  // Wrap selected text in <sup>
                  const { from, to } = editor.state.selection;
                  const text = editor.state.doc.textBetween(from, to);
                  if (text) {
                    editor.chain().focus().insertContentAt({ from, to }, `<sup>${text}</sup>`).run();
                  }
                }}
                title="Superscript"
                className="px-2 py-1.5 text-[11px] font-en-sans text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                X<sup>2</sup>
              </button>
            </>
          )}
        </div>
      </BubbleMenu>

      {/* Editor content area */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1.5 transition-colors ${
        active
          ? "bg-accent text-white"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
