import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchControlProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SearchControl({ searchQuery, setSearchQuery }: SearchControlProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);
  const isDebouncing = localSearch !== debouncedSearch;

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      setSearchQuery(debouncedSearch);
    }
  }, [debouncedSearch, searchQuery, setSearchQuery]);

  // Sincronizar quando searchQuery muda externamente (ex: limpar filtros)
  useEffect(() => {
    if (searchQuery !== localSearch && searchQuery !== debouncedSearch) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  return (
    <div className="flex-1 max-w-md">
      <div className="relative">
        {isDebouncing ? (
          <Loader2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          placeholder="Buscar por nome, SKU, categoria ou marca..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-10 border-purple-200 focus:border-purple-400"
        />
      </div>
    </div>
  );
}
