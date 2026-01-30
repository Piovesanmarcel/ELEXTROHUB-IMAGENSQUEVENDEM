
import { Button } from "@/components/ui/button";
import { Zap, Scissors } from "lucide-react";

interface TabSectionProps {
  activeTab: 'enhance' | 'background';
  onTabChange: (tab: 'enhance' | 'background') => void;
}

export const TabSection = ({ activeTab, onTabChange }: TabSectionProps) => {
  return (
    <div className="flex justify-center">
      <div className="bg-white rounded-lg p-2 shadow-lg border inline-flex">
        <Button
          onClick={() => onTabChange('enhance')}
          variant={activeTab === 'enhance' ? 'default' : 'ghost'}
          className={`flex items-center gap-2 px-6 py-3 ${
            activeTab === 'enhance' 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
              : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
          }`}
        >
          <Zap className="h-4 w-4" />
          Melhorar com DeepAI
        </Button>
        <Button
          onClick={() => onTabChange('background')}
          variant={activeTab === 'background' ? 'default' : 'ghost'}
          className={`flex items-center gap-2 px-6 py-3 ml-1 ${
            activeTab === 'background' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Scissors className="h-4 w-4" />
          Remover Fundo
        </Button>
      </div>
    </div>
  );
};
