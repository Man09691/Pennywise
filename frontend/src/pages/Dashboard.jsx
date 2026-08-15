import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

import SummaryCard from "../components/dashboard/SummaryCard";
import { getDashboardSummary } from "../services/dashboardService";
import { apiRequest } from "../services/api";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  async function loadDashboard() {
    try {
      const token = localStorage.getItem("token");

      const data = await getDashboardSummary(token);

      const transactionData = await apiRequest("/transactions");

      setTransactions(transactionData.transactions);
      setSummary(data.summary);
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    async function initializeDashboard() {
      setLoading(true);

      await loadDashboard();

      setLoading(false);
    }

    initializeDashboard();
  }, []);

  function handleDeleteTransaction(transaction) {
    setError("");
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  }

  async function confirmDeleteTransaction() {
    if (!transactionToDelete || deleting) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await apiRequest(`/transactions/${transactionToDelete._id}`, {
        method: "DELETE",
      });

      await loadDashboard();

      setShowDeleteModal(false);
      setTransactionToDelete(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  function handleEditTransaction(transactionId) {
    navigate(`/transactions?edit=${transactionId}`);
  }

  if (loading) {
    return <h1>Loading dashboard...</h1>;
  }

  if (error) {
    return <h1>{error}</h1>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back!</h1>

        <p>Here's what's happening with your money.</p>
      </div>

      <div className="summary-grid">
        <SummaryCard title="Total Balance" amount={summary.balance} />

        <SummaryCard title="Total Income" amount={summary.totalIncome} />

        <SummaryCard title="Total Expenses" amount={summary.totalExpense} />
      </div>

      <div className="recent-transactions">
        <h2>Recent Transactions</h2>

        {transactions.map((transaction) => (
          <div className="transaction-item" key={transaction._id}>
            <div>
              <h3>{transaction.title}</h3>

              <p>
                {transaction.category.name}
                {" · "}
                {transaction.paymentMethod}
              </p>
            </div>

            <div>
              <strong>
                {transaction.type === "income" ? "+" : "-"}₹{transaction.amount}
              </strong>

              <button
                type="button"
                title="Edit transaction"
                onClick={() => handleEditTransaction(transaction._id)}
              >
                <Pencil size={18} />
              </button>

              <button
                type="button"
                title="Delete transaction"
                onClick={() => handleDeleteTransaction(transaction)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {showDeleteModal && transactionToDelete && (
          <div className="delete-modal-overlay">
            <div className="delete-modal">
              <div className="delete-modal-icon">
                <Trash2 size={24} />
              </div>

              <h2>Delete Transaction?</h2>

              <p>
                Are you sure you want to delete{" "}
                <strong>"{transactionToDelete.title}"</strong>?
              </p>

              <p className="delete-modal-warning">
                This transaction will be removed from your transaction list.
              </p>

              <div className="delete-modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTransactionToDelete(null);
                    setError("");
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="delete-confirm-button"
                  onClick={confirmDeleteTransaction}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
