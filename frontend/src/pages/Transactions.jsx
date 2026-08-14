import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    paymentMethod: "",
    date: "",
    note: "",
  });

  // Load all transactions
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

  // Load all categories
  async function loadCategories() {
    try {
      const data = await apiRequest("/categories");

      setCategories(data.categories);
    } catch (error) {
      setError(error.message);
    }
  }

  // Load transactions and categories when page opens
  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, []);

  // Handle normal form field changes
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  // Add a new custom category
  async function handleAddCategory() {
    setError("");

    if (!newCategoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      const data = await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: formData.type,
        }),
      });

      // Reload categories
      await loadCategories();

      // Automatically select the newly created category
      setFormData({
        ...formData,
        category: data.category._id,
      });

      // Close category form
      setShowCategoryForm(false);

      // Clear category input
      setNewCategoryName("");
    } catch (error) {
      setError(error.message);
    }
  }

  // Submit new transaction
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    // Basic frontend validation
    if (
      !formData.title.trim() ||
      !formData.amount ||
      !formData.category ||
      !formData.paymentMethod
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const transactionData = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        date: formData.date || undefined,
        note: formData.note.trim() || undefined,
      };

      await apiRequest("/transactions", {
        method: "POST",
        body: JSON.stringify(transactionData),
      });

      // Refresh transaction list
      await loadTransactions();

      // Close modal
      setShowForm(false);

      // Reset transaction form
      setFormData({
        title: "",
        amount: "",
        type: "expense",
        category: "",
        paymentMethod: "",
        date: "",
        note: "",
      });

      // Reset category form as well
      setShowCategoryForm(false);
      setNewCategoryName("");
    } catch (error) {
      setError(error.message);
    }
  }

  // Categories matching selected transaction type
  const filteredCategories = categories.filter(
    (category) => category.type === formData.type
  );

  if (loading) {
    return <h1>Loading transactions...</h1>;
  }

  if (error && !showForm) {
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
              {transaction.type === "income" ? "+" : "-"}₹
              {transaction.amount}
            </strong>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="transaction-form">
          <div className="transaction-form-card">
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setShowForm(false);
                setError("");
                setShowCategoryForm(false);
                setNewCategoryName("");
              }}
            >
              ×
            </button>

            <h2>Add Transaction</h2>

            {error && <p className="form-error">{error}</p>}

            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="form-group">
                <label>Title</label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter transaction title"
                />
              </div>

              {/* Amount */}
              <div className="form-group">
                <label>Amount</label>

                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Type */}
              <div className="form-group">
                <label>Type</label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={(event) => {
                    setFormData({
                      ...formData,
                      type: event.target.value,
                      category: "",
                    });

                    // Hide category creation form if type changes
                    setShowCategoryForm(false);
                    setNewCategoryName("");
                  }}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Category */}
              <div className="form-group">
                <label>Category</label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (value === "other") {
                      setShowCategoryForm(true);

                      setFormData({
                        ...formData,
                        category: "",
                      });

                      return;
                    }

                    setFormData({
                      ...formData,
                      category: value,
                    });

                    setShowCategoryForm(false);
                  }}
                >
                  <option value="">Select category</option>

                  {filteredCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}

                  <option value="other">
                    Other → Add new category
                  </option>
                </select>

                {/* Add New Category Form */}
                {showCategoryForm && (
                  <div className="add-category-form">
                    <label>New Category</label>

                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(event) =>
                        setNewCategoryName(event.target.value)
                      }
                      placeholder="Enter category name"
                    />

                    <div>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                      >
                        Add Category
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setNewCategoryName("");
                          setError("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label>Payment Method</label>

                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">
                    Bank Transfer
                  </option>
                </select>
              </div>

              {/* Date */}
              <div className="form-group">
                <label>Date</label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>

              {/* Note */}
              <div className="form-group">
                <label>Note</label>

                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Optional note"
                />
              </div>

              {/* Buttons */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                    setShowCategoryForm(false);
                    setNewCategoryName("");
                  }}
                >
                  Cancel
                </button>

                <button type="submit">
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;