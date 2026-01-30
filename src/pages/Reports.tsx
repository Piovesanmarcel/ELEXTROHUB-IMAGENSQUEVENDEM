
import { Reports as ReportsComponent } from "@/components/Reports";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">
          Análise detalhada dos seus dados de vendas e estoque
        </p>
      </div>

      <ReportsComponent />
    </div>
  );
};

export default Reports;
