
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectFilterProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
  label: string;
}

export function MultiSelectFilter({
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  label
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOption = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange([...options]);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const removeItem = (value: string) => {
    onSelectionChange(selectedValues.filter(v => v !== value));
  };

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            {selectedValues.length === 0 ? (
              placeholder
            ) : (
              `${selectedValues.length} ${label}(s) selecionado(s)`
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedValues.length === options.length}
              >
                Selecionar Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedValues.length === 0}
              >
                Limpar Todos
              </Button>
            </div>
            
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={() => handleToggleOption(option)}
                  />
                  <label
                    htmlFor={option}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedValues.map((value) => (
            <Badge key={value} variant="secondary" className="text-xs">
              {value}
              <button
                onClick={() => removeItem(value)}
                className="ml-1 hover:bg-red-100 rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
