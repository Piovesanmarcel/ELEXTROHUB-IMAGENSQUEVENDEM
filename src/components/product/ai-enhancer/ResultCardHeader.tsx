
import { MessageSquare } from "lucide-react";

interface ResultCardHeaderProps {
  label: string;
}

export const ResultCardHeader = ({ label }: ResultCardHeaderProps) => {
  return (
    <div className="flex items-center gap-2 mb-3">
      <MessageSquare className="h-4 w-4 text-purple-600" />
      <h3 className="font-semibold text-gray-800">{label}</h3>
    </div>
  );
};
