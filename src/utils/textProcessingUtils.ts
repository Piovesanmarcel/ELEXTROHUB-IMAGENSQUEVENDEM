
// Função para remover emojis de um texto
export const removeEmojis = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/gu, '');
};

// Função para formatar os tópicos de conversão no formato estruturado
export const formatTopicosConversao = (topicosRaw: string): string => {
  if (!topicosRaw || topicosRaw.trim() === '') {
    return '';
  }

  try {
    console.log('🔍 Processando tópicos raw:', topicosRaw.substring(0, 200) + '...');

    // Primeiro, tentar extrair o improvedText se for um objeto JSON
    let textoFinal = '';
    
    try {
      const parsed = JSON.parse(topicosRaw);
      
      // Se tem improvedText, usar ele diretamente
      if (parsed.improvedText && typeof parsed.improvedText === 'string') {
        textoFinal = parsed.improvedText;
        console.log('✅ Extraído improvedText do JSON');
      } 
      // Se é uma string direta
      else if (typeof parsed === 'string') {
        textoFinal = parsed;
        console.log('✅ Usando string direta do JSON');
      }
      // Se não tem improvedText, usar o texto original
      else {
        textoFinal = topicosRaw;
        console.log('⚠️ JSON sem improvedText, usando raw');
      }
    } catch {
      // Se não é JSON válido, usar o texto direto
      textoFinal = topicosRaw;
      console.log('⚠️ Não é JSON válido, usando texto direto');
    }

    // Remover o cabeçalho "**🔍 DESCRIÇÃO SEO OTIMIZADA**" se existir
    textoFinal = textoFinal.replace(/\*\*🔍\s*DESCRIÇÃO\s+SEO\s+OTIMIZADA\*\*/gi, '').trim();
    
    // Remover quebras de linha no início
    textoFinal = textoFinal.replace(/^[\n\r\s]+/, '');
    
    // Remover todos os emojis
    textoFinal = removeEmojis(textoFinal);
    
    // NOVA VALIDAÇÃO: Verificar se o texto não é excessivamente longo
    if (textoFinal.length > 30000) {
      console.log(`⚠️ Texto muito longo (${textoFinal.length} chars), truncando para 30000`);
      textoFinal = textoFinal.substring(0, 29997) + '...';
    }
    
    // Se já está formatado (contém **), retornar sem emojis
    if (textoFinal.includes('**')) {
      console.log('✅ Texto já formatado, removendo emojis e retornando');
      return textoFinal;
    }

    // Se chegou até aqui, aplicar formatação estruturada
    console.log('🔄 Aplicando formatação estruturada...');
    
    // Dividir o texto em seções baseado em palavras-chave comuns
    const lines = textoFinal.split('\n').filter(line => line.trim());
    
    // Organizar o conteúdo no formato estruturado
    let formattedText = '';
    let currentSection = '';
    let sections = {
      intro: '',
      especificacoes: [],
      beneficios: [],
      garantias: [],
      idealPara: []
    };

    // Processar cada linha para categorizar o conteúdo
    for (const line of lines) {
      const cleanLine = line.trim();
      
      if (cleanLine.toLowerCase().includes('especificaç') || 
          cleanLine.toLowerCase().includes('técnica') ||
          cleanLine.toLowerCase().includes('material') ||
          cleanLine.toLowerCase().includes('dimensõ')) {
        currentSection = 'especificacoes';
        if (!cleanLine.startsWith('•') && !cleanLine.startsWith('-')) {
          sections.especificacoes.push(cleanLine);
        }
      } else if (cleanLine.toLowerCase().includes('benefício') || 
                 cleanLine.toLowerCase().includes('vantag') ||
                 cleanLine.toLowerCase().includes('ideal para') ||
                 (cleanLine.startsWith('•') || cleanLine.startsWith('-'))) {
        if (cleanLine.toLowerCase().includes('ideal para')) {
          currentSection = 'idealPara';
        } else {
          currentSection = 'beneficios';
        }
        
        if (currentSection === 'beneficios' && (cleanLine.startsWith('•') || cleanLine.startsWith('-'))) {
          sections.beneficios.push(cleanLine.replace(/^[•-]\s*/, ''));
        } else if (currentSection === 'idealPara') {
          sections.idealPara.push(cleanLine.replace(/^[•-]\s*/, ''));
        }
      } else if (cleanLine.toLowerCase().includes('garantia') || 
                 cleanLine.toLowerCase().includes('entrega') ||
                 cleanLine.toLowerCase().includes('suporte') ||
                 cleanLine.toLowerCase().includes('qualidade')) {
        currentSection = 'garantias';
        sections.garantias.push(cleanLine);
      } else if (!sections.intro && cleanLine.length > 20) {
        // Primeira linha substancial vira a introdução
        sections.intro = cleanLine;
      } else {
        // Adicionar à seção atual ou benefícios como padrão
        if (currentSection === 'especificacoes') {
          sections.especificacoes.push(cleanLine);
        } else if (currentSection === 'beneficios') {
          sections.beneficios.push(cleanLine.replace(/^[•-]\s*/, ''));
        } else if (currentSection === 'idealPara') {
          sections.idealPara.push(cleanLine.replace(/^[•-]\s*/, ''));
        } else {
          sections.beneficios.push(cleanLine.replace(/^[•-]\s*/, ''));
        }
      }
    }

    // Construir o texto formatado sem emojis
    if (sections.intro) {
      formattedText += sections.intro + '\n\n';
    }

    // Especificações Técnicas
    if (sections.especificacoes.length > 0) {
      formattedText += '**ESPECIFICAÇÕES TÉCNICAS**\n';
      formattedText += sections.especificacoes.join('; ') + '\n\n';
    }

    // Principais Benefícios
    if (sections.beneficios.length > 0) {
      formattedText += '**PRINCIPAIS BENEFÍCIOS**\n';
      sections.beneficios.forEach(beneficio => {
        formattedText += `• ${beneficio}\n`;
      });
      formattedText += '\n';
    }

    // Garantias e Ofertas
    formattedText += '**GARANTA JÁ O SEU!**\n';
    if (sections.garantias.length > 0) {
      sections.garantias.forEach(garantia => {
        formattedText += `✅ ${garantia}\n`;
      });
    } else {
      formattedText += '✅ Entrega rápida e segura\n';
      formattedText += '✅ Garantia de qualidade\n';
      formattedText += '✅ Suporte especializado\n';
      formattedText += '✅ Melhor custo-benefício do mercado\n';
    }
    formattedText += '\n';

    // Ideal Para
    if (sections.idealPara.length > 0) {
      formattedText += '**IDEAL PARA:**\n';
      sections.idealPara.forEach(item => {
        formattedText += `- ${item}\n`;
      });
    }

    // Remover emojis do texto final formatado e aplicar limite
    let resultado = removeEmojis(formattedText.trim());
    
    // CORREÇÃO CRÍTICA: Garantir que não exceda o limite
    if (resultado.length > 30000) {
      console.log(`⚠️ Resultado formatado muito longo (${resultado.length} chars), truncando`);
      resultado = resultado.substring(0, 29997) + '...';
    }
    
    console.log('✅ Formatação concluída sem emojis:', resultado.substring(0, 200) + '...');
    return resultado;

  } catch (error) {
    console.log('❌ Erro ao formatar tópicos:', error);
    // Retornar o texto original sem emojis e truncado se houver erro
    let textoSeguro = removeEmojis(topicosRaw);
    if (textoSeguro.length > 30000) {
      textoSeguro = textoSeguro.substring(0, 29997) + '...';
    }
    return textoSeguro;
  }
};
