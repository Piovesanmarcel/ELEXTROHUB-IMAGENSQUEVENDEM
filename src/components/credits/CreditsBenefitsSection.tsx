
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface CreditsBenefitsSectionProps {
  benefits: Benefit[];
}

export const CreditsBenefitsSection = ({ benefits }: CreditsBenefitsSectionProps) => {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md mb-6">
          <Star className="h-6 w-6 text-purple-600" />
          <span className="text-purple-600 font-semibold">Benefícios Exclusivos</span>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Por que melhorar suas imagens?
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Descubra como a melhoria de imagens com IA pode revolucionar seu negócio e aumentar suas vendas
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {benefits.map((benefit, index) => (
          <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-105">
            <CardContent className="p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-6 shadow-lg">
                <benefit.icon className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
