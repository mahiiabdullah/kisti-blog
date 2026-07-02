"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useCallback, useRef } from "react";
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
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

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
        class: `prose-editor min-h-[${rows * 2}rem] outline-none px-3 py-2 text-sm leading-relaxed`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setToolbarVisible(false);
        setShowLinkInput(false);
        return;
      }
      // Position toolbar above selection
      const view = editor.view;
      const start = view.coordsAtPos(from);
      const wrapper = wrapperRef.current;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        setToolbarPos({
          top: start.top - rect.top - 44,
          left: Math.max(0, start.left - rect.left),
        });
      }
      setToolbarVisible(true);
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

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
    <div ref={wrapperRef} className="border border-border bg-background relative">
      {/* Floating toolbar */}
      {toolbarVisible && (
        <div
          className="absolute z-50 flex items-center bg-popover border border-border shadow-lg divide-x divide-border"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
          onMouseDown={(e) => e.preventDefault()} // prevent blur
        >
          {showLinkInput ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                autoFocus
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); applyLink(); }
                  if (e.key === "Escape") setShowLinkInput(false);
                }}
                placeholder="https://…"
                className="text-xs border-none outline-none bg-transparent w-48 font-en-sans"
              />
              <button onClick={applyLink} className="text-xs px-2 py-0.5 bg-accent text-white rounded-sm">OK</button>
              <button onClick={() => setShowLinkInput(false)} className="text-muted-foreground hover:text-foreground ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
                <Bold className="w-3.5 h-3.5" />
              </ToolBtn>
              <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
                <Italic className="w-3.5 h-3.5" />
              </ToolBtn>
              <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
                <UnderlineIcon className="w-3.5 h-3.5" />
              </ToolBtn>
              <ToolBtn active={editor.isActive("link")} onClick={openLinkInput} title="Link">
                <LinkIcon className="w-3.5 h-3.5" />
              </ToolBtn>
              {editor.isActive("link") && (
                <ToolBtn active={false} onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
                  <X className="w-3.5 h-3.5" />
                </ToolBtn>
              )}
            </>
          )}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolBtn({
  children, active, onClick, title,
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
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`px-2 py-1.5 transition-colors ${
        active ? "bg-accent text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
