import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TransactionTableRow from "./TransactionTableRow";

interface TransactionTableProps {
  transactions: any[];
  categoryMap: Record<string, any>;
  accountMap: Record<string, string>;
  cardMap: Record<string, string>;
  subcategoryMap: Record<string, any>;
  categories: any[];
  onUpdate: (id: string, data: any) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

const TransactionTable = ({ 
  transactions, 
  categoryMap, 
  accountMap, 
  cardMap,
  subcategoryMap,
  categories,
  onUpdate, 
  onDelete 
}: TransactionTableProps) => {
  return (
    <div className="overflow-x-auto mb-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Subcategoria</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Conta/Cartão</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TransactionTableRow
              key={transaction.id}
              transaction={transaction}
              categoryMap={categoryMap}
              accountMap={accountMap}
              cardMap={cardMap}
              subcategoryMap={subcategoryMap}
              categories={categories}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionTable;