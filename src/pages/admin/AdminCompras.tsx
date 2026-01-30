import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Download, CreditCard, DollarSign, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CreditPurchase {
  id: string;
  user_id: string;
  user_email: string;
  stripe_session_id: string;
  credits_amount: number;
  amount_paid: number;
  currency: string;
  created_at: string;
}

interface Stats {
  totalPurchases: number;
  totalCredits: number;
  totalRevenue: number;
}

const AdminCompras = () => {
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPurchases: 0, totalCredits: 0, totalRevenue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-get-purchases', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      setPurchases(data.purchases || []);
      setStats(data.stats || { totalPurchases: 0, totalCredits: 0, totalRevenue: 0 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao buscar compras:', errorMessage);
      toast.error('Erro ao carregar histórico de compras');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter(purchase =>
    purchase.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.stripe_session_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string = 'brl') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Email', 'Créditos', 'Valor', 'ID Sessão'];
    const rows = filteredPurchases.map(p => [
      format(new Date(p.created_at), 'dd/MM/yyyy HH:mm'),
      p.user_email,
      p.credits_amount,
      formatCurrency(p.amount_paid, p.currency),
      p.stripe_session_id,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `compras-creditos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Arquivo CSV exportado!');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Compras</h1>
          <p className="text-muted-foreground">Visualize todas as transações de créditos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPurchases} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={purchases.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Vendidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(purchases.map(p => p.user_email)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            <Input
              placeholder="Buscar por email ou ID da sessão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm mt-2"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhuma transação encontrada para esta busca.' : 'Nenhuma compra registrada ainda.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Créditos</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>ID Sessão Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {format(new Date(purchase.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{purchase.user_email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{purchase.credits_amount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(purchase.amount_paid, purchase.currency)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {purchase.stripe_session_id.slice(0, 20)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCompras;
