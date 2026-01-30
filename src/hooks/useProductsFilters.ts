
import { useState } from "react";

export function useProductsFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "empty" | "instock">("all");
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterBrands, setFilterBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("all");
  const [imageFilter, setImageFilter] = useState<"all" | "few" | "small" | "poorQuality" | "none">("all");
  const [enhancementFilter, setEnhancementFilter] = useState<"all" | "enhanced" | "not_enhanced">("all");
  const [unifiedCommandsFilter, setUnifiedCommandsFilter] = useState<"all" | "with_commands" | "without_commands">("all");
  const [hostedImagesFilter, setHostedImagesFilter] = useState<"all" | "with_hosted">("all");
  const [readyForAdsFilter, setReadyForAdsFilter] = useState<"all" | "ready">("all");

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterCategories([]);
    setFilterBrands([]);
    setPriceRange("all");
    setImageFilter("all");
    setEnhancementFilter("all");
    setUnifiedCommandsFilter("all");
    setHostedImagesFilter("all");
    setReadyForAdsFilter("all");
  };

  const handleCardFilter = (filter: "total" | "low" | "empty" | "fewImages" | "smallImages" | "poorQualityImages" | "noImages" | "enhanced" | "unifiedCommands") => {
    // Reset outros filtros quando usar card filter
    setSearchQuery("");
    setFilterCategories([]);
    setFilterBrands([]);
    setPriceRange("all");
    
    switch (filter) {
      case "low":
        setFilterStatus("low");
        setImageFilter("all");
        setEnhancementFilter("all");
        setUnifiedCommandsFilter("all");
        break;
      case "empty":
        setFilterStatus("empty");
        setImageFilter("all");
        setEnhancementFilter("all");
        setUnifiedCommandsFilter("all");
        break;
      case "fewImages":
        setFilterStatus("all");
        setImageFilter("few");
        setEnhancementFilter("all");
        setUnifiedCommandsFilter("all");
        break;
      case "smallImages":
        setFilterStatus("all");
        setImageFilter("small");
        setEnhancementFilter("all");
        setUnifiedCommandsFilter("all");
        break;
      case "poorQualityImages":
        setFilterStatus("all");
        setImageFilter("poorQuality");
        setEnhancementFilter("all");
        setUnifiedCommandsFilter("all");
        break;
      case "noImages":
        setFilterStatus("all");
        setImageFilter("none");
        setEnhancementFilter("all");
        setUnifiedCommandsFilter("all");
        break;
      case "enhanced":
        setFilterStatus("all");
        setImageFilter("all");
        setEnhancementFilter("enhanced");
        setUnifiedCommandsFilter("all");
        break;
      case "unifiedCommands":
        setFilterStatus("all");
        setImageFilter("all");
        setEnhancementFilter("all");
        setUnifiedCommandsFilter("with_commands");
        break;
      default:
        setFilterStatus("all");
        setImageFilter("all");
        setEnhancementFilter("all");
        setUnifiedCommandsFilter("all");
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterCategories,
    setFilterCategories,
    filterBrands,
    setFilterBrands,
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
    handleClearFilters,
    handleCardFilter,
  };
}
