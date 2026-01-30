
import { memo, useCallback, useState } from "react";
import { SearchControl } from "./filters/SearchControl";
import { FilterControls } from "./filters/FilterControls";
import { ViewModeControls } from "./filters/ViewModeControls";
import { ActionControls } from "./filters/ActionControls";

interface ProductsFiltersControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
  setViewMode: (mode: "grid" | "list") => void;
  viewMode: "grid" | "list";
  handleSync: (forceResync?: boolean, forceAll?: boolean) => Promise<void>;
  isSyncing: boolean;
  selectedPricing: string;
}

export const ProductsFiltersControls = memo(function ProductsFiltersControls({
  searchQuery,
  setSearchQuery,
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
  setViewMode,
  viewMode,
  handleSync,
  isSyncing,
  selectedPricing,
}: ProductsFiltersControlsProps) {
  const [showSyncOptions, setShowSyncOptions] = useState(false);

  const handleSyncClick = useCallback(() => {
    setShowSyncOptions(!showSyncOptions);
  }, [showSyncOptions]);

  const handleNormalSync = useCallback(() => {
    handleSync(false, false);
    setShowSyncOptions(false);
  }, [handleSync]);

  const handleForceSync = useCallback(() => {
    handleSync(true, false);
    setShowSyncOptions(false);
  }, [handleSync]);

  const handleForceAllSync = useCallback(() => {
    handleSync(false, true);
    setShowSyncOptions(false);
  }, [handleSync]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchControl searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <ViewModeControls viewMode={viewMode} setViewMode={setViewMode} />
          <ActionControls
            isSyncing={isSyncing}
            showSyncOptions={showSyncOptions}
            onSyncClick={handleSyncClick}
            onNormalSync={handleNormalSync}
            onForceSync={handleForceSync}
            onForceAllSync={handleForceAllSync}
          />
        </div>
      </div>

      {selectedPricing === 'none' && (
        <FilterControls
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterCategories={filterCategories}
          setFilterCategories={setFilterCategories}
          categories={categories}
          filterBrands={filterBrands}
          setFilterBrands={setFilterBrands}
          brands={brands}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          imageFilter={imageFilter}
          setImageFilter={setImageFilter}
          enhancementFilter={enhancementFilter}
          setEnhancementFilter={setEnhancementFilter}
          unifiedCommandsFilter={unifiedCommandsFilter}
          setUnifiedCommandsFilter={setUnifiedCommandsFilter}
          hostedImagesFilter={hostedImagesFilter}
          setHostedImagesFilter={setHostedImagesFilter}
          readyForAdsFilter={readyForAdsFilter}
          setReadyForAdsFilter={setReadyForAdsFilter}
        />
      )}
    </div>
  );
});
