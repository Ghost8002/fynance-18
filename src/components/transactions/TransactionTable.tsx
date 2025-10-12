
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TransactionTableRow from "./TransactionTableRow";

interface TransactionTableProps {
  transactions: any[];
  categoryMap: Record<string, any>;
  accountMap: Record<string, string>;
  cardMap: Record<string, string>;
  onUpdate: (id: string, data: any) => Promise<{ error?: string }>;
  onDelete: (id: string) => Promise<{ error?: string }>;
}

const TransactionTable = ({ 
  transactions, 
  categoryMap, 
  accountMap, 
  cardMap, 
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
