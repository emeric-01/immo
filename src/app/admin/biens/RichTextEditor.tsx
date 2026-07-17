"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import styles from "../properties.module.css";
import { useState } from "react";

export function RichTextEditor({ initialContent = "", name }: { initialContent?: string; name: string }) {
  const content = initialContent.trim().startsWith("<") ? initialContent : initialContent.split("\n").filter(Boolean).map(line => `<p>${line}</p>`).join("");
  const [html,setHtml]=useState(content);
  const editor = useEditor({ content, extensions: [StarterKit], immediatelyRender: false, onUpdate:({editor:current})=>setHtml(current.getHTML()) });
  if (!editor) return <textarea defaultValue={initialContent} name={name} rows={8}/>;
  return <div className={styles.richEditor}>
    <div className={styles.editorToolbar} aria-label="Mise en forme du texte">
      <button aria-label="Annuler" onClick={()=>editor.chain().focus().undo().run()} type="button"><Undo2/></button>
      <button aria-label="Rétablir" onClick={()=>editor.chain().focus().redo().run()} type="button"><Redo2/></button>
      <span/>
      <button aria-label="Gras" data-active={editor.isActive("bold")} onClick={()=>editor.chain().focus().toggleBold().run()} type="button"><Bold/></button>
      <button aria-label="Italique" data-active={editor.isActive("italic")} onClick={()=>editor.chain().focus().toggleItalic().run()} type="button"><Italic/></button>
      <button aria-label="Intertitre" data-active={editor.isActive("heading",{level:2})} onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()} type="button"><Heading2/></button>
      <button aria-label="Liste" data-active={editor.isActive("bulletList")} onClick={()=>editor.chain().focus().toggleBulletList().run()} type="button"><List/></button>
      <button aria-label="Liste numérotée" data-active={editor.isActive("orderedList")} onClick={()=>editor.chain().focus().toggleOrderedList().run()} type="button"><ListOrdered/></button>
    </div>
    <EditorContent editor={editor}/><input name={name} type="hidden" value={html} readOnly/>
  </div>;
}
