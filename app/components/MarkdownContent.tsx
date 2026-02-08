import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'lucide-react'

export default function MarkdownContent({
  content,
  smallSize = false,
}: {
  content: string
  smallSize?: boolean
}) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h3 className="font-bold mt-4 mb-2 text-lg text-gray-900 dark:text-white">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              className={`mb-3 text-gray-900 dark:text-white leading-relaxed ${smallSize ? 'text-sm' : ''}`}
            >
              {children}
            </p>
          ),
          strong: ({ children }) => <span className="font-bold">{children}</span>,
          ul: ({ children }) => <ul className="pl-4 mb-1.5 list-disc">{children}</ul>,
          li: ({ children }) => <li className="mb-2 leading-relaxed">{children}</li>,
          table: ({ children }) => (
            <div className="my-4">
              <table className="w-full table-fixed divide-y divide-gray-300 dark:divide-gray-600">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800/50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100 border-b-2 border-gray-300 dark:border-gray-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 break-words">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <span className="relative inline-flex align-middle mx-0.5 group/link">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-[var(--accent-active)] dark:border-[var(--accent-active-dark)] text-[var(--accent-active)] dark:text-[var(--accent-active-dark)] hover:bg-[var(--accent-active)] hover:text-white dark:hover:bg-[var(--accent-active-dark)] dark:hover:text-white transition-all cursor-pointer"
              >
                <Link className="w-3 h-3" />
              </a>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 px-2.5 py-1.5 text-xs leading-tight rounded-md shadow-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 max-w-60 w-max opacity-0 pointer-events-none group-hover/link:opacity-100 transition-opacity">
                {children}
              </span>
            </span>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
