
import { ReactNode } from "react";

interface ProductDetailsLayoutProps {
  children: ReactNode;
}

export const ProductDetailsLayout = ({ children }: ProductDetailsLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {children}
      </div>
    </div>
  );
};
