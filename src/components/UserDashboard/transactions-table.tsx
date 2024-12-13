import { useState } from "react";
import { FaExternalLinkAlt, FaChevronRight } from "react-icons/fa";

interface Transaction {
  type: "Stock" | "Pool";
  name: string;
  status: "Withdraw" | "Deposit" | "Take Offer" | "Make Offer";
  quantity: string;
  price: string;
  allocation: string;
  currency: string;
  liquidity: string;
  date: string;
  logo: string; // Path to the logo image
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsComponent({ transactions }: TransactionsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Withdraw":
        return "bg-red-400/10 text-red-400";
      case "Deposit":
        return "bg-green-400/10 text-green-400";
      case "Take Offer":
        return "bg-blue-400/10 text-blue-400";
      case "Make Offer":
        return "bg-gray-400/10 text-gray-400";
      default:
        return "bg-gray-400/10 text-gray-400";
    }
  };

  return (
    <>
      {/* Small Transactions Box */}
      {!isModalOpen && (
        <div className="mt-6 rounded-lg bg-[#0a1929] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Transactions</h2>
            <FaExternalLinkAlt
              onClick={toggleModal}
              className="text-gray-400 hover:text-gray-200 cursor-pointer"
              size={18}
            />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full table-auto text-left text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="pb-4">TYPE</th>
                  <th className="pb-4">NAME</th>
                  <th className="pb-4">STATUS</th>
                  <th className="pb-4">QUANTITY</th>
                  <th className="pb-4">DATE</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.slice(0, 3).map((transaction, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-800 text-white hover:bg-gray-800"
                  >
                    <td className="py-4">
                      <img
                        src={transaction.logo}
                        alt={transaction.type}
                        className="w-6 h-6 rounded-full"
                      />
                    </td>
                    <td className="py-4">{transaction.name}</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusStyle(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-4">{transaction.quantity}</td>
                    <td className="py-4">{transaction.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 p-6">
          <div className="bg-[#0a1929] rounded-lg">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold text-white">Transactions</h2>
              <button
                onClick={toggleModal}
                className="text-gray-400 hover:text-gray-200 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="text-gray-400">
                    <th className="pb-4">
                      <input type="checkbox" className="h-4 w-4 accent-blue-400" />
                    </th>
                    <th className="pb-4">TYPE</th>
                    <th className="pb-4">NAME</th>
                    <th className="pb-4">STATUS</th>
                    <th className="pb-4">QUANTITY</th>
                    <th className="pb-4">PRICE</th>
                    <th className="pb-4">ALLOCATION</th>
                    <th className="pb-4">CURRENCY</th>
                    <th className="pb-4">LIQUIDITY</th>
                    <th className="pb-4">DATE</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.map((transaction, index) => (
                    <tr
                      key={index}
                      className="border-t border-gray-800 text-white hover:bg-gray-800"
                    >
                      <td className="py-4">
                        <input type="checkbox" className="h-4 w-4 accent-blue-400" />
                      </td>
                      <td className="py-4">
                        <img
                          src={transaction.logo}
                          alt={transaction.type}
                          className="w-6 h-6 rounded-full"
                        />
                      </td>
                      <td className="py-4">{transaction.name}</td>
                      <td className="py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${getStatusStyle(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-4">{transaction.quantity}</td>
                      <td className="py-4">{transaction.price}</td>
                      <td className="py-4">{transaction.allocation}</td>
                      <td className="py-4">{transaction.currency}</td>
                      <td className="py-4">
                        <span className="text-green-400">{transaction.liquidity}</span>
                      </td>
                      <td className="py-4">{transaction.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
