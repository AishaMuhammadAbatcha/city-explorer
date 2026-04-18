import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Citation } from '@/types/agent'

interface AnswerCardProps {
  content: string
  citations: Citation[]
  pending?: boolean
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function AnswerCard({ content, citations, pending }: AnswerCardProps) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <div className="prose prose-sm dark:prose-invert max-w-none [&_*]:my-2 [&_ul]:pl-5 [&_ol]:pl-5 [&_a]:underline">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content || (pending ? '…' : '')}
        </ReactMarkdown>
      </div>
      {citations.length > 0 && (
        <ol className="border-t border-border pt-2 space-y-1 text-xs text-muted-foreground">
          {citations.map((c, i) => (
            <li key={`${c.url}-${i}`} id={`citation-${i + 1}`} className="flex gap-2">
              <span className="font-medium">[{i + 1}]</span>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-foreground"
                title={c.url}
              >
                {c.title || hostOf(c.url)}
                <span className="ml-1 opacity-60">— {hostOf(c.url)}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
