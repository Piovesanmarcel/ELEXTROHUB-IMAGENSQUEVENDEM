
import { Button } from "@/components/ui/button";
import { List, Grid } from "lucide-react";

interface ViewModeControlsProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export function ViewModeControls({ viewMode, setViewMode }: ViewModeControlsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="icon"
        className={viewMode === "grid" ? "bg-purple-100 text-purple-600" : "text-gray-500"}
        onClick={() => setViewMode("grid")}
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={viewMode === "list" ? "bg-purple-100 text-purple-600" : "text-gray-500"}
        onClick={() => setViewMode("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
