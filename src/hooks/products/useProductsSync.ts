
import { useProductsActions } from "../useProductsActions";

export function useProductsSync(loadProducts: () => Promise<void>) {
  const actionsHook = useProductsActions();

  const handleSync = async () => {
    const success = await actionsHook.handleSync();
    if (success) {
      await loadProducts();
    }
  };

  return {
    isSyncing: actionsHook.isSyncing,
    syncProgress: actionsHook.syncProgress,
    handleSync,
    handleEditProduct: actionsHook.handleEditProduct,
    handleViewProduct: actionsHook.handleViewProduct
  };
}
