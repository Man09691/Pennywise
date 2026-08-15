import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { Pencil, Trash2 } from "lucide-react";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [categories, setCategories] = useState([]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    paymentMethod: "",
    date: "",
    note: "",
  });

  // --------------------------------------------------
  // Load all transactions
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Load all categories
  // --------------------------------------------------

  async function loadCategories() {
    try {
      const data = await apiRequest("/categories");

      setCategories(data.categories);
    } catch (error) {
      setError(error.message);
    }
  }

  // --------------------------------------------------
  // Load transactions and categories when page opens
  // --------------------------------------------------

  useEffect(() => {
    async function loadData() {
      await Promise.all([loadTransactions(), loadCategories()]);
    }

    loadData();
  }, []);

  // --------------------------------------------------
  // Handle normal form field changes
  // --------------------------------------------------

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  // --------------------------------------------------
  // Open transaction for editing
  // --------------------------------------------------

  function handleEditTransaction(transaction) {
    setError("");

    setEditingTransaction(transaction);

    setFormData({
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category._id,
      paymentMethod: transaction.paymentMethod,
      date: transaction.date
        ? new Date(transaction.date).toISOString().split("T")[0]
        : "",
      note: transaction.note || "",
    });

    setShowCategoryForm(false);
    setNewCategoryName("");

    setShowForm(true);
  }

  // --------------------------------------------------
  // Automatically open edit form from Dashboard
  // --------------------------------------------------

  useEffect(() => {
    const editId = searchParams.get("edit");

    if (!editId || transactions.length === 0) {
      return;
    }

    const transaction = transactions.find((item) => item._id === editId);

    if (transaction) {
      handleEditTransaction(transaction);

      // Remove ?edit=... from URL
      setSearchParams({});
    }
  }, [transactions, searchParams, setSearchParams]);

  // --------------------------------------------------
  // Delete transaction
  // --------------------------------------------------

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

      await loadTransactions();

      setShowDeleteModal(false);
      setTransactionToDelete(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // --------------------------------------------------
  // Add a new custom category
  // --------------------------------------------------

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

      // Automatically select newly created category
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

  // --------------------------------------------------
  // Submit transaction
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

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

    setSubmitting(true);

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

      // Edit existing transaction
      if (editingTransaction) {
        await apiRequest(`/transactions/${editingTransaction._id}`, {
          method: "PUT",
          body: JSON.stringify(transactionData),
        });
      }

      // Add new transaction
      else {
        await apiRequest("/transactions", {
          method: "POST",
          body: JSON.stringify(transactionData),
        });
      }

      // Refresh transactions
      await loadTransactions();

      // Close modal
      setShowForm(false);

      // Clear editing transaction
      setEditingTransaction(null);

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

      // Reset category form
      setShowCategoryForm(false);
      setNewCategoryName("");
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------
  // Categories matching selected transaction type
  // --------------------------------------------------

  const filteredCategories = categories.filter(
    (category) => category.type === formData.type,
  );

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return <h1>Loading transactions...</h1>;
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error && !showForm) {
    return <h1>{error}</h1>;
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="transactions-page">
      {/* Header */}

      <div className="transactions-header">
        <h1>Transactions</h1>

        <p>Manage your income and expenses.</p>
      </div>

      {/* Add Transaction Button */}

      <button
        type="button"
        onClick={() => {
          setEditingTransaction(null);

          setFormData({
            title: "",
            amount: "",
            type: "expense",
            category: "",
            paymentMethod: "",
            date: "",
            note: "",
          });

          setShowCategoryForm(false);
          setNewCategoryName("");
          setError("");

          setShowForm(true);
        }}
      >
        + Add Transaction
      </button>

      {/* Transaction List */}

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

            <div>
              <strong>
                {transaction.type === "income" ? "+" : "-"}₹{transaction.amount}
              </strong>

              {/* Edit */}

              <button
                type="button"
                title="Edit transaction"
                onClick={() => handleEditTransaction(transaction)}
              >
                <Pencil size={18} />
              </button>

              {/* Delete */}

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
      </div>

      {/* Add / Edit Transaction Modal */}

      {showForm && (
        <div className="transaction-form">
          <div className="transaction-form-card">
            {/* Close */}

            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setShowForm(false);
                setEditingTransaction(null);
                setError("");
                setShowCategoryForm(false);
                setNewCategoryName("");

                // Remove edit parameter if present
                setSearchParams({});
              }}
            >
              ×
            </button>

            {/* Form title */}

            <h2>
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </h2>

            {/* Error */}

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

                  <option value="other">Other → Add new category</option>
                </select>

                {/* Add New Category */}

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
                      <button type="button" onClick={handleAddCategory}>
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

                  <option value="Debit Card">Debit Card</option>

                  <option value="Credit Card">Credit Card</option>

                  <option value="UPI">UPI</option>

                  <option value="Card">Card</option>

                  <option value="Bank Transfer">Bank Transfer</option>
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
                    setEditingTransaction(null);
                    setError("");
                    setShowCategoryForm(false);
                    setNewCategoryName("");
                    setSearchParams({});
                  }}
                >
                  Cancel
                </button>

                <button type="submit" disabled={submitting}>
                  {submitting
                    ? editingTransaction
                      ? "Updating..."
                      : "Adding..."
                    : editingTransaction
                      ? "Update Transaction"
                      : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
  );
}

export default Transactions;
