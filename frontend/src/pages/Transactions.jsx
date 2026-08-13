import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    paymentMethod: "",
    date: "",
    note: "",
  });

  async function loadTransactions() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/transactions");

      setTransactions(data.transactions);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
        const data = await apiRequest("/categories");

        setCategories(data.categories);
    } catch (error) {
        setError(error.message);
    }
}

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, []);

  if (loading) {
    return <h1>Loading transactions...</h1>;
  }

  if (error) {
    return <h1>{error}</h1>;
  }

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h1>Transactions</h1>
        <p>Manage your income and expenses.</p>
      </div>

      <button type="button" onClick={() => setShowForm(true)}>
        + Add Transaction
      </button>

      <div className="transactions-list">
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

            <strong>
              {transaction.type === "income" ? "+" : "-"}₹{transaction.amount}
            </strong>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="transaction-form">
          <div className="transaction-form">
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
            <h2>Add Transaction</h2>

            <form>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter transaction title"
                />
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      amount: event.target.value,
                    })
                  }
                  placeholder="Enter amount"
                />
              </div>

              <div className="form-group">
                <label>Type</label>

                <select
                  value={formData.type}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      type: event.target.value,
                      category: "",
                    })
                  }
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payment Method</label>

                <select
                  value={formData.paymentMethod}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      paymentMethod: event.target.value,
                    })
                  }
                >
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>

                <input
                  type="date"
                  value={formData.date}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      date: event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Note</label>

                <textarea
                  value={formData.note}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      note: event.target.value,
                    })
                  }
                  placeholder="Optional note"
                />
              </div>

              <div>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>

                <button type="submit">Add Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
