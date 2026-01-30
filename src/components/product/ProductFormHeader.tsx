
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

interface ProductFormHeaderProps {
  isEditing: boolean;
}

export const ProductFormHeader = ({ isEditing }: ProductFormHeaderProps) => {
  return (
    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
      <CardTitle className="flex items-center gap-2">
        <ShoppingCart className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold gradient-text">Informações do Produto</span>
      </CardTitle>
    </CardHeader>
  );
};
