import { Bot } from "lucide-react";
import { Fragment } from "react";

interface ResultCardContentProps {
  improvedText: string;
}

// Função para processar negrito inline (**texto**)
const processInlineBold = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-purple-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
};

// Função para limpar ** órfãos (que não formam par)
const cleanOrphanBold = (text: string): string => {
  // Primeiro marca negrito válido, depois remove ** órfãos, depois restaura
  return text
    .replace(/\*\*([^*]+)\*\*/g, '⟦BOLD⟧$1⟦/BOLD⟧')
    .replace(/\*\*/g, '')
    .replace(/⟦BOLD⟧/g, '**')
    .replace(/⟦\/BOLD⟧/g, '**');
};

// Função para forçar quebras de linha antes de emojis principais e bullets (fallback)
const normalizeLineBreaks = (text: string): string => {
  const emojiSeparators = ['🔍', '🎯', '⚙️', '🔄', '📋', '✨', '🛒', '💡', '❓', '🎁', '🎄', '💰', '🏆'];
  let normalized = cleanOrphanBold(text);

  // Quebra antes de emojis de seção
  emojiSeparators.forEach(emoji => {
    normalized = normalized.replace(new RegExp(`([^\\n])${emoji}`, 'g'), `$1\n\n${emoji}`);
  });

  // Quebra antes de bullets quando vêm após texto (não após newline)
  normalized = normalized.replace(/([^\n])- /g, '$1\n- ');
  normalized = normalized.replace(/([^\n])• /g, '$1\n• ');
  normalized = normalized.replace(/([^\n])✅ /g, '$1\n✅ ');
  normalized = normalized.replace(/([^\n])✓ /g, '$1\n✓ ');

  // ✅ Substituir Headers Markdown (####) por Check de Confirmação
  normalized = normalized.replace(/^#{1,6}\s*/gm, '✅ ');

  return normalized.trim();
};

export const ResultCardContent = ({ improvedText }: ResultCardContentProps) => {
  // Normalizar quebras de linha (fallback para respostas sem formatação)
  const normalizedText = normalizeLineBreaks(improvedText);

  // Padrão para detectar linhas que começam com emoji
  const emojiPattern = /^[🔍🎯⚙️🔄📋✨🛒💡❓✅🎁🎄💰🏆🌟⭐]/;

  const lines = normalizedText.split('\n');

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-3 rounded-md space-y-3">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-800">Resultado IA</span>
      </div>

      <div className="text-sm text-purple-800 whitespace-pre-line leading-relaxed border border-purple-300 p-3 rounded bg-white">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();

          // Verificar se a linha anterior era um título com emoji
          const previousLine = index > 0 ? lines[index - 1].trim() : '';
          const previousWasEmojiTitle = emojiPattern.test(previousLine);

          // Linha vazia: só adiciona espaçamento se NÃO vier após título com emoji
          if (!trimmedLine) {
            if (previousWasEmojiTitle) {
              return null; // Ignora a linha vazia após título
            }
            return <div key={index} className="h-2" />;
          }

          // Linha que começa com emoji = título de seção (negrito + espaçamento)
          if (emojiPattern.test(trimmedLine)) {
            return (
              <div key={index} className="font-bold text-purple-900 mt-3 mb-1 first:mt-0">
                {processInlineBold(trimmedLine)}
              </div>
            );
          }

          // Linha com bullet, traço ou checkbox = item de lista
          if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.startsWith('✅') || trimmedLine.startsWith('✓')) {
            return (
              <div key={index} className="ml-3 py-0.5">
                {processInlineBold(trimmedLine)}
              </div>
            );
          }

          // Linha numerada (1., 2., etc) = item de lista numerada
          if (/^\d+\./.test(trimmedLine)) {
            return (
              <div key={index} className="ml-3 py-0.5">
                {processInlineBold(trimmedLine)}
              </div>
            );
          }

          // Linha normal com possível negrito inline
          return <div key={index}>{processInlineBold(trimmedLine)}</div>;
        })}
      </div>
    </div>
  );
};
