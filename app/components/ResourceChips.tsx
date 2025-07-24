interface ResourceChipsProps {
  resources: { url: string; label: string }[]
}

export default function ResourceChips({ resources }: ResourceChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {resources.map((resource, idx) => (
        <a
          key={idx}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            py-1 px-2 text-xs font-medium rounded-full transition-all cursor-pointer
            bg-[var(--button-background)] dark:bg-[var(--button-background-dark)]
            text-gray-700 dark:text-gray-200 hover:bg-[var(--accent-hover)] dark:hover:bg-[var(--accent-hover-dark)]
            border border-[var(--accent-active)] dark:border-[var(--accent-active-dark)]
          `}
        >
          {resource.label}
        </a>
      ))}
    </div>
  )
}
