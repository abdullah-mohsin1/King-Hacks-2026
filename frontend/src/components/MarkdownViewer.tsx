import { useEffect, useRef } from 'react';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Simple markdown-like rendering
      let html = content
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-navy-950 mt-6 mb-3">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-navy-950 mt-8 mb-4">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-navy-950 mt-10 mb-5">$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-navy-950">$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
        // Code
        .replace(/`(.*?)`/gim, '<code class="bg-gray-200 px-2 py-1 rounded text-sm font-mono">$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-navy-950 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
        // Lists
        .replace(/^- (.*$)/gim, '<li class="ml-4 mb-2">$1</li>')
        // Line breaks
        .replace(/\n\n/gim, '</p><p class="mb-4">')
        .replace(/\n/gim, '<br>');

      // Wrap in paragraphs
      html = '<p class="mb-4">' + html + '</p>';

      // Wrap lists
      html = html.replace(/(<li.*<\/li>)/gim, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>');

      ref.current.innerHTML = html;
    }
  }, [content]);

  return (
    <div
      ref={ref}
      className="prose max-w-none text-gray-800 leading-relaxed"
    />
  );
}

