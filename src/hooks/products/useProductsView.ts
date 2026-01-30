
import { useState } from "react";

export function useProductsView() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  return {
    viewMode,
    setViewMode
  };
}
