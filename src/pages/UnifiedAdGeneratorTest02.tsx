
import { useState } from "react";
import { useMagicStudioController } from "@/hooks/useMagicStudioController";
import { BetaHubMenu, BetaVariantId } from "@/components/beta/BetaHubMenu";
import { Variant00Default } from "@/components/beta/variants/Variant00Default";
import { Variant01Aero } from "@/components/beta/variants/Variant01Aero";



export default function UnifiedAdGeneratorTest02() {
  // ===== CONTROLLER (The Brain) =====
  const { state, actions } = useMagicStudioController();

  // ===== UI ROUTER STATE =====
  const [currentVariant, setCurrentVariant] = useState<BetaVariantId>('default');

  // ===== RENDER =====
  return (
    <div className="min-h-screen font-sans">
      {/* 1. The Variant Router */}
      {currentVariant === 'default' && <Variant00Default state={state} actions={actions} />}

      {currentVariant === 'variant-01-aero' && <Variant01Aero state={state} actions={actions} />}



      {/* 2. The Floating Beta Hub Menu */}
      <BetaHubMenu
        currentVariant={currentVariant}
        onSelectVariant={setCurrentVariant}
      />
    </div>
  );
}
