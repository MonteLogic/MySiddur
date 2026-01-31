'use client';

import React, { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

interface CodeProps {
  node?: unknown;
  className?: string;
  children?: ReactNode;
}

function CodeRenderer({ className, children }: CodeProps) {
  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match;
  
  if (!isInline && match) {
    return (
      <div className="code-block-wrapper">
        <div className="code-language">{match[1]}</div>
        <pre className={className}>
          <code className={className}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
  
  return (
    <code className={className}>
      {children}
    </code>
  );
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="markdown-content"
      components={{
        code: CodeRenderer,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}