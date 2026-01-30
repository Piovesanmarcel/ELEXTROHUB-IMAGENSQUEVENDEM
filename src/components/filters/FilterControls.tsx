
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectFilter } from "./MultiSelectFilter";

interface FilterControlsProps {
  filterStatus: "all" | "low" | "empty" | "instock";
  setFilterStatus: (status: "all" | "low" | "empty" | "instock") => void;
  filterCategories: string[];
  setFilterCategories: (categories: string[]) => void;
  categories: string[];
  filterBrands: string[];
  setFilterBrands: (brands: string[]) => void;
  brands: string[];
  priceRange: string;
  setPriceRange: (range: string) => void;
  imageFilter: "all" | "few" | "small" | "poorQuality" | "none";
  setImageFilter: (filter: "all" | "few" | "small" | "poorQuality" | "none") => void;
  enhancementFilter: "all" | "enhanced" | "not_enhanced";
  setEnhancementFilter: (filter: "all" | "enhanced" | "not_enhanced") => void;
  unifiedCommandsFilter: "all" | "with_commands" | "without_commands";
  setUnifiedCommandsFilter: (filter: "all" | "with_commands" | "without_commands") => void;
  hostedImagesFilter: "all" | "with_hosted";
  setHostedImagesFilter: (filter: "all" | "with_hosted") => void;
  readyForAdsFilter: "all" | "ready";
  setReadyForAdsFilter: (filter: "all" | "ready") => void;
}

export function FilterControls({
  filterStatus,
  setFilterStatus,
  filterCategories,
  setFilterCategories,
  categories,
  filterBrands,
  setFilterBrands,
  brands,
  priceRange,
  setPriceRange,
  imageFilter,
  setImageFilter,
  enhancementFilter,
  setEnhancementFilter,
  unifiedCommandsFilter,
  setUnifiedCommandsFilter,
  hostedImagesFilter,
  setHostedImagesFilter,
  readyForAdsFilter,
  setReadyForAdsFilter,
}: FilterControlsProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="min-w-[140px]">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Status
        </label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="instock">Em Estoque</SelectItem>
            <SelectItem value="low">Estoque Baixo</SelectItem>
            <SelectItem value="empty">Sem Estoque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[180px]">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Categorias
        </label>
        <MultiSelectFilter
          options={categories}
          selectedValues={filterCategories}
          onSelectionChange={setFilterCategories}
          placeholder="Selecionar categorias"
          label="categoria"
        />
      </div>

      <div className="min-w-[180px]">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Marcas
        </label>
        <MultiSelectFilter
          options={brands}
          selectedValues={filterBrands}
          onSelectionChange={setFilterBrands}
          placeholder="Selecionar marcas"
          label="marca"
        />
      </div>

      <div className="min-w-[140px]">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Imagens
        </label>
        <Select value={imageFilter} onValueChange={setImageFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Imagens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="few">Poucas Imagens</SelectItem>
            <SelectItem value="small">Imagens Pequenas</SelectItem>
            <SelectItem value="poorQuality">Qualidade Ruim</SelectItem>
            <SelectItem value="none">Sem Imagens</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[140px]">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Melhorias DeepAI
        </label>
        <Select value={enhancementFilter} onValueChange={setEnhancementFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Melhorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="enhanced">Já Melhoradas</SelectItem>
            <SelectItem value="not_enhanced">Não Melhoradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px]">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Comando Unificado
        </label>
        <Select value={unifiedCommandsFilter} onValueChange={setUnifiedCommandsFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Comandos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="with_commands">Com Comandos</SelectItem>
            <SelectItem value="without_commands">Sem Comandos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[180px]">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Imagens Hospedadas
        </label>
        <Select value={hostedImagesFilter} onValueChange={setHostedImagesFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Hospedadas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="with_hosted">Com +30 Hospedadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[180px]">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Pronto para Anúncios
        </label>
        <Select value={readyForAdsFilter} onValueChange={setReadyForAdsFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ready">✅ Prontos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
