import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DOMPurify from 'dompurify';

interface CopywritingFormatterProps {
  copywriting: string;
}

// Mapeamento de emojis para cada seção do copywriting
const sectionEmojis: Record<number, string> = {
  1: '🎯',  // Título Atraente e Impactante
  2: '✨',  // Introdução Captadora de Atenção
  3: '📋',  // Destaque das Principais Características
  4: '💡',  // Dor x Solução para Conversão
  5: '🏆',  // Principais Benefícios para o Cliente
  6: '⏰',  // Gatilho de Escassez e Urgência
  7: '🛒',  // Chamada para Ação Forte
  8: '❓',  // Perguntas Frequentes (FAQ)
  9: '🏠',  // Ambientes Ideais
  10: '🔍', // Títulos de Cauda Longa (SEO)
};

export const CopywritingFormatter = ({ copywriting }: CopywritingFormatterProps) => {

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Texto copiado!');
    } catch (error) {
      toast.error('Erro ao copiar texto');
    }
  };

  const formatCopywriting = (text: string) => {
    // Quebrar o texto em linhas
    const lines = text.split('\n');

    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Se a linha estiver vazia, retorna quebra de linha
      if (!trimmedLine) {
        return <br key={index} />;
      }

      // ✅ PRIMEIRO: Verificar se é seção numerada (1-10) - ANTES de títulos genéricos
      // Isso garante que ### 1. Título seja capturado com emoji
      const sectionPatterns = [
        /^#{1,4}\s*(\d+)\.\s*(.+)/,            // # 1. Título, ## 1. Título, ### 1. Título, #### 1. Título
        /^#{1,4}\s*(\d+)\)\s*(.+)/,            // # 1) Título, ## 1) Título, etc
        /^\*\*(\d+)\.\*\*\s*(.+)/,             // **1.** Título
        /^\*\*(\d+)\)\*\*\s*(.+)/,             // **1)** Título
        /^\*\*\s*(\d+)\.\s*(.+?)\*\*/,         // ** 1. Título **
        /^(\d+)\.\s*\*\*(.+?)\*\*/,            // 1. **Título**
        /^(\d+)\)\s*\*\*(.+?)\*\*/,            // 1) **Título**
        /^(\d+)\.\s+([A-ZÀ-Ú][^:]+):/,        // 1. Título Atraente:
        /^(\d+)\)\s+([A-ZÀ-Ú][^:]+):/,        // 1) Título Atraente:
        /^(\d+)\.\s+([A-ZÀ-Ú].{10,})$/,       // 1. Título Atraente (sem markdown, mín 10 chars)
        /^(\d+)\)\s+([A-ZÀ-Ú].{10,})$/,       // 1) Título Atraente
        /^(\d+)\s*[-–—]\s*(.+)/,              // 1 - Título ou 1 — Título
        /^(\d+):\s*(.+)/,                     // 1: Título
      ];

      for (const pattern of sectionPatterns) {
        const sectionMatch = trimmedLine.match(pattern);
        if (sectionMatch) {
          const sectionNum = parseInt(sectionMatch[1]);
          if (sectionNum >= 1 && sectionNum <= 10) {
            let titleText = sectionMatch[2]
              .replace(/\*\*/g, '')           // Remove negrito
              .replace(/:$/, '')              // Remove : no final
              .replace(/^[""]|[""]$/g, '')    // Remove aspas curvas no início/fim
              .replace(/"/g, '')              // Remove aspas retas
              .trim();

            // Verificar se já tem emoji no início do título
            const hasExistingEmoji = /^[\u{1F300}-\u{1F9FF}]|^[\u{2600}-\u{26FF}]|^[\u{2700}-\u{27BF}]/u.test(titleText);
            const emoji = hasExistingEmoji ? '' : (sectionEmojis[sectionNum] || '📌');

            return (
              <div key={index} className="mb-3 mt-6 first:mt-0">
                <h3 className="text-base font-bold text-emerald-700 flex items-center gap-2">
                  {emoji && <span className="text-lg">{emoji}</span>}
                  <span>{sectionNum}. {titleText}</span>
                </h3>
              </div>
            );
          }
        }
      }

      // DEPOIS: Títulos principais genéricos (sem número, começam com #)
      if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('####')) {
        const cleanTitle = trimmedLine
          .replace(/^#+\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/"/g, '')
          .trim();
        return (
          <div key={index} className="mb-4 mt-6 first:mt-0">
            <h2 className="text-xl font-bold text-emerald-800 mb-2 border-b border-emerald-200 pb-2">
              {cleanTitle}
            </h2>
          </div>
        );
      }

      // Outros subtítulos (#### sem número)
      if (trimmedLine.startsWith('####')) {
        const cleanSubtitle = trimmedLine
          .replace(/^#+\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/"/g, '')
          .trim();
        return (
          <div key={index} className="mb-3 mt-5">
            <h3 className="text-base font-semibold text-emerald-600 mb-2">
              {cleanSubtitle}
            </h3>
          </div>
        );
      }

      // Itens de lista (começam com -, * ou números seguidos de ponto)
      if (trimmedLine.match(/^[-*]\s/) || (trimmedLine.match(/^\d+\.\s/) && trimmedLine.length < 150)) {
        const cleanItem = trimmedLine
          .replace(/^[-*]\s/, '')
          .replace(/^\d+\.\s/, '')
          .replace(/"/g, '');
        const hasSubText = cleanItem.includes(':');

        if (hasSubText) {
          const [title, ...rest] = cleanItem.split(':');
          const description = rest.join(':');
          return (
            <div key={index} className="mb-3 ml-4 p-3 bg-emerald-50/50 rounded-lg border-l-4 border-emerald-300">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                <div>
                  <span className="font-semibold text-emerald-800">{title.trim()}:</span>
                  <span className="text-gray-700 ml-1">{description.trim()}</span>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div key={index} className="mb-2 ml-4 flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-gray-700">{cleanItem}</span>
            </div>
          );
        }
      }

      // Texto em negrito
      if (trimmedLine.includes('**') && !trimmedLine.startsWith('#')) {
        const cleanLine = trimmedLine.replace(/"/g, '');
        const formattedText = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-800">$1</strong>');
        // 🔐 SEGURANÇA: Sanitizar HTML para prevenir XSS
        const sanitizedHtml = DOMPurify.sanitize(formattedText, {
          ALLOWED_TAGS: ['strong'],
          ALLOWED_ATTR: ['class']
        });
        return (
          <p key={index} className="mb-3 text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        );
      }

      // Texto normal - remover aspas
      const cleanText = trimmedLine.replace(/^[""]|[""]$/g, '').replace(/"/g, '');
      return (
        <p key={index} className="mb-3 text-gray-700 leading-relaxed">
          {cleanText}
        </p>
      );
    });
  };

  return (
    <div className="relative">
      {/* Botão de copiar fixo no canto superior direito */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={() => copyToClipboard(copywriting)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-emerald-300 text-emerald-600 hover:bg-emerald-50 shadow-lg"
        >
          <Copy className="h-4 w-4 mr-1" />
          Copiar Tudo
        </Button>
      </div>

      {/* Conteúdo formatado */}
      <div className="pr-20">
        {formatCopywriting(copywriting)}
      </div>
    </div>
  );
};