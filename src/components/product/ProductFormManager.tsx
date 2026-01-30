
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductFormFields } from "./ProductFormFields";
import { Edit3 } from "lucide-react";

interface ProductFormManagerProps {
  product: any;
  isEditing: boolean;
  formData: any;
  onFormDataChange: (field: string, value: any) => void;
  onUpdateDescription: (type: 'short' | 'long' | 'name', value: string) => void;
}

export const ProductFormManager = ({
  product,
  isEditing,
  formData,
  onFormDataChange,
  onUpdateDescription
}: ProductFormManagerProps) => {
  return (
    <div className="space-y-6">
      {/* Product Form Fields */}
      <ProductFormFields
        product={product}
        isEditing={isEditing}
        formData={formData}
        onFormDataChange={onFormDataChange}
      />
    </div>
  );
};
