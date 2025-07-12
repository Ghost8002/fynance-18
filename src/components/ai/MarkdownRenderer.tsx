
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          // Customizar componentes do markdown
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground">{children}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-foreground">{children}</h3>,
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-3">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
