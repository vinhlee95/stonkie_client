import ReactMarkdown from 'react-markdown'

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
        components={{
          h2: ({ children }) => (
            <h3 className="font-bold mt-4 mb-2 text-lg text-gray-900 dark:text-white">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              className={`mb-3 text-gray-900 dark:text-white text-base leading-relaxed ${smallSize ? 'text-sm' : ''}`}
            >
              {children}
            </p>
          ),
          strong: ({ children }) => <span className="font-bold">{children}</span>,
          ul: ({ children }) => <ul className="pl-4 mb-1.5 list-disc">{children}</ul>,
          li: ({ children }) => <li className="mb-2 text-base leading-relaxed">{children}</li>,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 p-2 bg-gray-100 dark:bg-gray-800 text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-700 p-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
