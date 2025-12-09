'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownMessageProps {
  content: string
  isUser?: boolean
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className="block bg-slate-200 dark:bg-slate-700 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-slate-200 dark:bg-slate-700 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-3 italic my-2">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${
                isUser
                  ? 'text-white/90 hover:text-white'
                  : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
              }`}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          hr: () => (
            <hr className="border-slate-300 dark:border-slate-600 my-3" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

