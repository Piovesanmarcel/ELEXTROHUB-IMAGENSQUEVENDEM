import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, Trash2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { PremiumAdProduct, AdsStructureReport } from "@/utils/premiumAdsUtils";
import { getAdTypeName } from "@/utils/premiumAdsUtils";
import { toast } from "sonner";
import { useState } from "react";
import { generateExcelFile, downloadExcelFile } from "@/utils/blingSpreadsheetUtils";

interface PremiumAdsDisplayBlockProps {
  ads: PremiumAdProduct[];
  onClearAds: () => void;
  onDownloadSpreadsheet: () => void;
  onDownloadWebcSpreadsheet: () => void;
  productName: string;
  report?: AdsStructureReport;
}

export const PremiumAdsDisplayBlock = ({ 
  ads, 
  onClearAds, 
  onDownloadSpreadsheet,
  onDownloadWebcSpreadsheet,
  productName,
  report 
}: PremiumAdsDisplayBlockProps) => {
  const [openCards, setOpenCards] = useState<Set<number>>(new Set());

  const toggleCard = (index: number) => {
    const newOpenCards = new Set(openCards);
    if (newOpenCards.has(index)) {
      newOpenCards.delete(index);
    } else {
      newOpenCards.add(index);
    }
    setOpenCards(newOpenCards);
  };

  const copyImageUrls = (urls: string[]) => {
    const urlString = urls.join('|');
    navigator.clipboard.writeText(urlString);
    toast.success(`✅ ${urls.length} URLs copiadas!`);
  };
  
  const copyFullReport = () => {
    if (!report) {
      toast.error("Relatório não disponível");
      return;
    }
    
    let reportText = `📊 RELATÓRIO DE ESTRUTURA - ${productName}\n\n`;
    reportText += `✅ Válidos: ${report.validAds} | ⚠️ Com ajustes: ${report.invalidAds} | Total: ${report.totalAds}\n\n`;
    reportText += `📦 POOLS DISPONÍVEIS:\n`;
    Object.entries(report.poolCounts).forEach(([key, count]) => {
      if (count > 0) reportText += `  - ${key}: ${count}\n`;
    });
    reportText += `\n`;
    
    report.adsAnalysis.forEach((analysis) => {
      const status = analysis.isValid ? '✅' : '⚠️';
      reportText += `${status} ANÚNCIO #${analysis.adNumber} - ${analysis.adType}\n`;
      reportText += `   Esperado: ${analysis.expectedCounts.description}\n`;
      
      const b = analysis.imageBreakdown;
      reportText += `   Encontrado: Total ${b.total} | `;
      if (b.kit.exact + b.kit.generic + b.kit.wrong > 0) {
        reportText += `KIT (exatos:${b.kit.exact}, genéricos:${b.kit.generic}, errados:${b.kit.wrong}) | `;
      }
      if (b.marketing.total > 0) {
        reportText += `Marketing ${b.marketing.total} (Desc:${b.marketing.description}, Feat:${b.marketing.features}, Ben:${b.marketing.benefits}) | `;
      }
      if (b.runware > 0) reportText += `Runware:${b.runware} | `;
      if (b.geminiWhite > 0) reportText += `GeminiWhite:${b.geminiWhite} | `;
      if (b.geminiBackground > 0) reportText += `GeminiBg:${b.geminiBackground} | `;
      if (b.bfl > 0) reportText += `BFL:${b.bfl} | `;
      if (b.bflWhite > 0) reportText += `BFLWhite:${b.bflWhite} | `;
      if (b.showcase > 0) reportText += `Showcase:${b.showcase} | `;
      reportText += `\n`;
      
      if (analysis.issues.length > 0) {
        reportText += `   ⚠️ Problemas:\n`;
        analysis.issues.forEach(issue => reportText += `      - ${issue}\n`);
      }
      if (analysis.notes.length > 0) {
        reportText += `   📝 Notas:\n`;
        analysis.notes.forEach(note => reportText += `      - ${note}\n`);
      }
      reportText += `\n`;
    });
    
    navigator.clipboard.writeText(reportText);
    toast.success("📋 Relatório completo copiado!");
  };

  const handleClearWithConfirmation = () => {
    if (window.confirm("Tem certeza que deseja remover todos os anúncios salvos?")) {
      onClearAds();
      toast.success("✅ Anúncios removidos");
    }
  };

  const handleReDownload = () => {
    onDownloadSpreadsheet();
    toast.info("📥 Baixando planilha Bling...");
  };

  const handleReDownloadWebc = () => {
    onDownloadWebcSpreadsheet();
    toast.info("📥 Baixando planilha WEBC...");
  };

  return (
    <Card className="mt-4 border-purple-200 bg-gradient-to-br from-purple-50/50 to-yellow-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📦 Anúncios Premium Salvos
              <span className="text-sm font-normal text-muted-foreground">
                ({ads.length} anúncios)
              </span>
              {report && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  report.invalidAds === 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {report.invalidAds === 0 ? '✅ Estrutura OK' : `⚠️ ${report.invalidAds} com ajustes`}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Anúncios gerados para: <span className="font-semibold">{productName}</span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {report && (
              <Button
                onClick={copyFullReport}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Relatório
              </Button>
            )}
            <Button
              onClick={handleReDownload}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Planilha Bling
            </Button>
            <Button
              onClick={handleReDownloadWebc}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">Planilha WEBC</span>
            </Button>
            <Button
              onClick={handleClearWithConfirmation}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Tudo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {ads.map((ad, index) => {
          const isOpen = openCards.has(index);
          const adNumber = index + 1;
          const adTypeName = getAdTypeName(adNumber);
          const analysis = report?.adsAnalysis[index];

          return (
            <Collapsible key={index} open={isOpen} onOpenChange={() => toggleCard(index)}>
              <Card className={`border transition-colors ${
                analysis?.isValid === false 
                  ? 'border-yellow-300 hover:border-yellow-400' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <span className="text-purple-600">#{adNumber}</span>
                        {adTypeName}
                        {analysis && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            analysis.isValid 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {analysis.isValid ? '✅' : '⚠️'}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {ad.nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {ad.imageUrls.length} imagens
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    {/* Análise de estrutura */}
                    {analysis && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                        <div className="font-semibold text-gray-700">📊 Análise de Estrutura:</div>
                        <div className="text-gray-600">
                          <strong>Esperado:</strong> {analysis.expectedCounts.description}
                        </div>
                        <div className="space-y-1">
                          <strong className="text-gray-700">Encontrado:</strong>
                          {analysis.imageBreakdown.kit.exact + analysis.imageBreakdown.kit.generic + analysis.imageBreakdown.kit.wrong > 0 && (
                            <div className="ml-2">
                              • KIT: {analysis.imageBreakdown.kit.exact} exatos, {analysis.imageBreakdown.kit.generic} genéricos, {analysis.imageBreakdown.kit.wrong} errados
                            </div>
                          )}
                          {analysis.imageBreakdown.marketing.total > 0 && (
                            <div className="ml-2">
                              • Marketing: {analysis.imageBreakdown.marketing.total} (Desc: {analysis.imageBreakdown.marketing.description}, Feat: {analysis.imageBreakdown.marketing.features}, Ben: {analysis.imageBreakdown.marketing.benefits})
                            </div>
                          )}
                          {analysis.imageBreakdown.runware > 0 && (
                            <div className="ml-2">• Runware: {analysis.imageBreakdown.runware}</div>
                          )}
                          {analysis.imageBreakdown.geminiWhite > 0 && (
                            <div className="ml-2">• Gemini White: {analysis.imageBreakdown.geminiWhite}</div>
                          )}
                          {analysis.imageBreakdown.geminiBackground > 0 && (
                            <div className="ml-2">• Gemini Background: {analysis.imageBreakdown.geminiBackground}</div>
                          )}
                          {analysis.imageBreakdown.bfl > 0 && (
                            <div className="ml-2">• BFL: {analysis.imageBreakdown.bfl}</div>
                          )}
                          {analysis.imageBreakdown.bflWhite > 0 && (
                            <div className="ml-2">• BFL White: {analysis.imageBreakdown.bflWhite}</div>
                          )}
                          {analysis.imageBreakdown.runway > 0 && (
                            <div className="ml-2">• Runway: {analysis.imageBreakdown.runway}</div>
                          )}
                          {analysis.imageBreakdown.deepai > 0 && (
                            <div className="ml-2">• DeepAI: {analysis.imageBreakdown.deepai}</div>
                          )}
                          {analysis.imageBreakdown.showcase > 0 && (
                            <div className="ml-2">• Showcase: {analysis.imageBreakdown.showcase}</div>
                          )}
                          {analysis.imageBreakdown.whiteBackground > 0 && (
                            <div className="ml-2">• White Background: {analysis.imageBreakdown.whiteBackground}</div>
                          )}
                        </div>
                        {analysis.issues.length > 0 && (
                          <div className="mt-2 text-yellow-700 bg-yellow-50 rounded p-2">
                            <div className="font-semibold">⚠️ Problemas:</div>
                            {analysis.issues.map((issue, i) => (
                              <div key={i} className="ml-2">• {issue}</div>
                            ))}
                          </div>
                        )}
                        {analysis.notes.length > 0 && (
                          <div className="mt-2 text-blue-700 bg-blue-50 rounded p-2">
                            <div className="font-semibold">📝 Notas:</div>
                            {analysis.notes.map((note, i) => (
                              <div key={i} className="ml-2">• {note}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Informações do anúncio */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-gray-600 min-w-[60px]">Título:</span>
                        <span className="text-xs text-gray-800 flex-1">{ad.nome}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-gray-600 min-w-[60px]">SKU:</span>
                        <span className="text-xs text-gray-800">{ad.sku}</span>
                      </div>
                      {ad.descricao_curta && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-semibold text-gray-600 min-w-[60px]">Descrição:</span>
                          <span className="text-xs text-gray-600 flex-1 line-clamp-2">{ad.descricao_curta}</span>
                        </div>
                      )}
                    </div>

                    {/* Grade de imagens */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Imagens ({ad.imageUrls.length}):
                      </p>
                      <div className="grid grid-cols-8 gap-1">
                        {ad.imageUrls.map((url, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="aspect-square rounded border border-gray-200 overflow-hidden bg-gray-50"
                          >
                            <img
                              src={url}
                              alt={`Imagem ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botão de copiar URLs */}
                    <Button
                      onClick={() => copyImageUrls(ad.imageUrls)}
                      size="sm"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar URLs das Imagens (separadas por |)
                    </Button>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};
