"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLessonAction, updateLessonAction, ActionState } from "@/app/actions/lessons";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Bold, Italic, List, ListOrdered, Palette } from "lucide-react";

interface LessonFormProps {
  courseId: string;
  lesson?: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    section: string | null;
    driveUrl: string | null;
  };
}

export function LessonForm({ courseId, lesson }: LessonFormProps) {
  const updateLessonWithCourseAndId = lesson 
    ? updateLessonAction.bind(null, courseId, lesson.id)
    : createLessonAction.bind(null, courseId);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateLessonWithCourseAndId,
    null
  );

  const [contentHtml, setContentHtml] = useState(lesson?.content || "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
    ],
    content: lesson?.content || "",
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[200px] p-4 text-foreground',
      },
    },
    onUpdate: ({ editor }) => {
      setContentHtml(editor.getHTML());
    }
  });

  const [selectedWeeks, setSelectedWeeks] = useState<number[]>(() => {
    const sec = lesson?.section || "";
    const match = sec.match(/\d+/g);
    return match ? match.map(Number) : [];
  });

  const sectionString = selectedWeeks.length > 0 
    ? `Week ${selectedWeeks.sort((a,b) => a - b).join(" & ")}` 
    : "";

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      {state?.errors?.general && (
        <div className="p-3 text-sm font-medium bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          {state.errors.general[0]}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title" className="text-muted-foreground">Lesson Title</Label>
        <Input 
          id="title" 
          name="title" 
          defaultValue={lesson?.title || ""} 
          placeholder="e.g. Variables and Data Types"
          className="bg-background border-border text-foreground"
        />
        {state?.errors?.title && (
          <p className="text-sm text-destructive">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-muted-foreground">Description (Optional)</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={lesson?.description || ""} 
          placeholder="A short summary of this lesson"
          className="bg-background border-border text-foreground min-h-20"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Section / Week (Optional)</Label>
        <input type="hidden" name="section" value={sectionString} />
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between bg-background border-border text-left font-normal text-foreground hover:bg-card hover:text-foreground" />}>
              {sectionString || "Select Weeks..."}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border text-muted-foreground">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((weekNum) => (
                <DropdownMenuCheckboxItem
                  key={weekNum}
                  checked={selectedWeeks.includes(weekNum)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedWeeks([...selectedWeeks, weekNum]);
                    } else {
                      setSelectedWeeks(selectedWeeks.filter((w) => w !== weekNum));
                    }
                  }}
                  className="focus:bg-[#1f2937] focus:text-foreground"
                >
                  Week {weekNum}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="driveUrl" className="text-muted-foreground">Google Drive URL (Optional)</Label>
        <Input 
          id="driveUrl" 
          name="driveUrl" 
          defaultValue={lesson?.driveUrl || ""} 
          placeholder="e.g. https://drive.google.com/file/d/..."
          className="bg-background border-border text-foreground"
        />
        <p className="text-xs text-muted-foreground mt-1">Paste the link to the lecture slide or PDF.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Content (Optional)</Label>
        <input type="hidden" name="content" value={contentHtml} />
        <div className="border border-border rounded-md overflow-hidden bg-background">
          {editor && (
            <div className="flex items-center gap-1 border-b border-border p-2 bg-card">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-[#263244] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-[#263244]'}`}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-[#263244] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-[#263244]'}`}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-[#263244] mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-[#263244] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-[#263244]'}`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-[#263244] text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-[#263244]'}`}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-[#263244] mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setColor('#ef4444').run()}
                className={`h-8 w-8 p-0 ${editor.isActive('textStyle', { color: '#ef4444' }) ? 'bg-[#263244]' : 'hover:bg-[#263244]'}`}
                title="Red"
              >
                <div className="w-3 h-3 rounded-full bg-destructive" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setColor('#22c55e').run()}
                className={`h-8 w-8 p-0 ${editor.isActive('textStyle', { color: '#22c55e' }) ? 'bg-[#263244]' : 'hover:bg-[#263244]'}`}
                title="Green"
              >
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setColor('#000000').run()}
                className={`h-8 w-8 p-0 ${editor.isActive('textStyle', { color: '#000000' }) ? 'bg-[#263244]' : 'hover:bg-[#263244]'}`}
                title="Black"
              >
                <div className="w-3 h-3 rounded-full bg-black border border-slate-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().unsetColor().run()}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-[#263244]"
                title="Reset Color"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
        {state?.errors?.content && (
          <p className="text-sm text-destructive">{state.errors.content[0]}</p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-[#00A8E8] hover:bg-[#0077B6] text-foreground w-full sm:w-auto"
      >
        {isPending ? "Saving..." : lesson ? "Save Changes" : "Create Lesson"}
      </Button>
    </form>
  );
}
