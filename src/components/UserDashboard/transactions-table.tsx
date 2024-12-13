interface Transaction {
  type: "Stock" | "Pool";
  name: string;
  status: string;
  quantity: string;
  date: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="mt-6 rounded-lg bg-[#0a1929] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Transactions</h2>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400">
              <th className="pb-4">TYPE</th>
              <th className="pb-4">NAME</th>
              <th className="pb-4">STATUS</th>
              <th className="pb-4">QUANTITY</th>
              <th className="pb-4">DATE</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {transactions.map((transaction, index) => (
              <tr key={index} className="border-t border-gray-800 text-white">
                <td className="py-4">{transaction.type}</td>
                <td>{transaction.name}</td>
                <td>
                  <span className="rounded-full bg-green-400/10 px-2 py-1 text-xs text-green-400">
                    {transaction.status}
                  </span>
                </td>
                <td>{transaction.quantity}</td>
                <td>{transaction.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
