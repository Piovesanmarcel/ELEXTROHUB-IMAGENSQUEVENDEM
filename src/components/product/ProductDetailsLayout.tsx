
import { ReactNode } from "react";

interface ProductDetailsLayoutProps {
  children: ReactNode;
}

export const ProductDetailsLayout = ({ children }: ProductDetailsLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50" style={{ zoom: 0.85 }}>
      <div className="w-full max-w-[1700px] mx-auto px-4 py-2 space-y-4">
        {children}
      </div>
    </div>
  );
};
