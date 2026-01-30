
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface LogoUploaderProps {
  logoUrl: string;
  onLogoChange: (url: string) => void;
}

export const LogoUploader = ({ logoUrl, onLogoChange }: LogoUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione apenas arquivos de imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Converter para base64 para usar como URL temporária
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onLogoChange(result);
        toast.success("Logo carregada com sucesso!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao fazer upload da logo:", error);
      toast.error("Erro ao carregar a logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeLogo = () => {
    onLogoChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label>Logo da Empresa</Label>
      
      {logoUrl ? (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white">
            <img
              src={logoUrl}
              alt="Logo preview"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">Logo carregada</p>
            <Button
              variant="outline"
              size="sm"
              onClick={removeLogo}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="w-full h-20 border-dashed border-2 hover:border-purple-300"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-600">
              {isUploading ? "Carregando..." : "Clique para fazer upload da logo"}
            </span>
          </div>
        </Button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <p className="text-xs text-gray-500">
        Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
      </p>
    </div>
  );
};
