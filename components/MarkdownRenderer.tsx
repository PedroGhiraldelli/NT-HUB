interface MarkdownRendererProps {
  content: string
  className?: string
}

function renderMarkdown(text: string): string {
  return text
    // Títulos
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Negrito e itálico
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Código inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Separador
    .replace(/^---$/gm, '<hr/>')
    // Itens de lista
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Parágrafos: linhas que não são tags HTML
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed) return '<br/>'
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<hr')) {
        return trimmed
      }
      return `<p>${trimmed}</p>`
    })
    .join('\n')
    // Agrupa <li> consecutivos em <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
    // Remove <br/> duplos
    .replace(/(<br\/>){2,}/g, '<br/>')
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}
