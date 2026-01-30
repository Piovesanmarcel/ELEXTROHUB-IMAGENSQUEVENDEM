
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

export function ProductsPagination({ currentPage, totalPages, setCurrentPage }: ProductsPaginationProps) {
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Sincronizar pageInput quando currentPage mudar externamente
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  if (totalPages <= 1) return null;

  const handlePageInputSubmit = () => {
    const parsed = parseInt(pageInput);
    const clamped = isNaN(parsed)
      ? currentPage
      : Math.min(totalPages, Math.max(1, parsed));

    if (clamped !== currentPage) {
      setCurrentPage(clamped);
    }
    setShowPageInput(false);
    setPageInput(clamped.toString());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    } else if (e.key === 'Escape') {
      setShowPageInput(false);
      setPageInput(currentPage.toString());
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const next = Math.max(1, currentPage - 1);
          console.log(`⬅️ PAGINATION UI - Anterior: indo para ${next}`);
          setCurrentPage(next);
        }}
        disabled={currentPage === 1}
        className="text-purple-600 border-purple-200 hover:bg-purple-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>
      
      <div className="flex items-center gap-1">
        {showPageInput ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handlePageInputSubmit}
              className="w-16 h-8 text-center text-sm"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">
              de {totalPages}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setShowPageInput(true)}
            className="text-sm text-muted-foreground hover:text-purple-600 px-2 py-1 rounded transition-colors"
          >
            Página {currentPage} de {totalPages}
          </button>
        )}
      </div>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const next = currentPage + 1;
          if (next <= totalPages) {
            console.log(`➡️ PAGINATION UI - Próxima: indo para ${next}`);
            setCurrentPage(next);
          } else {
            console.log('➡️ PAGINATION UI - Ignorado: next > totalPages', { next, totalPages });
          }
        }}
        disabled={currentPage === totalPages}
        className="text-purple-600 border-purple-200 hover:bg-purple-50"
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
