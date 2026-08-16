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

  // ==================================================
  // Notify Dashboard that transactions changed
  // ==================================================

  function notifyTransactionsUpdated() {
    window.dispatchEvent(new Event("transactionsUpdated"));
  }

  // ==================================================
  // Load Transactions
  // ==================================================

  async function loadTransactions(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const data = await apiRequest("/transactions", {
        cache: "no-store",
      });

      setTransactions(data.transactions || []);
    } catch (error) {
      setError(error.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  // ==================================================
  // Load Categories
  // ==================================================

  async function loadCategories() {
    try {
      const data = await apiRequest("/categories", {
        cache: "no-store",
      });

      setCategories(data.categories || []);
    } catch (error) {
      setError(error.message);
    }
  }

  // ==================================================
  // Initial Load
  // ==================================================

  useEffect(() => {
    async function loadData() {
      await Promise.all([
        loadTransactions(true),
        loadCategories(),
      ]);
    }

    loadData();
  }, []);

  // ==================================================
  // Handle Input Change
  // ==================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  // ==================================================
  // Reset Form
  // ==================================================

  function resetForm() {
    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "",
      paymentMethod: "",
      date: "",
      note: "",
    });

    setEditingTransaction(null);
    setShowCategoryForm(false);
    setNewCategoryName("");
  }

  // ==================================================
  // Open Add Transaction Form
  // ==================================================

  function handleAddTransaction() {
    resetForm();

    setError("");
    setShowForm(true);
  }

  // ==================================================
  // Open Edit Transaction
  // ==================================================

  function handleEditTransaction(transaction) {
    setError("");

    setEditingTransaction(transaction);

    setFormData({
      title: transaction.title || "",
      amount: transaction.amount ?? "",
      type: transaction.type || "expense",

      category:
        transaction.category?._id ||
        transaction.category ||
        "",

      paymentMethod: transaction.paymentMethod || "",

      date: transaction.date
        ? new Date(transaction.date)
            .toISOString()
            .split("T")[0]
        : "",

      note: transaction.note || "",
    });

    setShowCategoryForm(false);
    setNewCategoryName("");

    setShowForm(true);
  }

  // ==================================================
  // Automatically Open Edit From Dashboard
  // ==================================================

  useEffect(() => {
    const editId = searchParams.get("edit");

    if (!editId || transactions.length === 0) {
      return;
    }

    const transaction = transactions.find(
      (item) => item._id === editId,
    );

    if (transaction) {
      handleEditTransaction(transaction);

      setSearchParams({});
    }
  }, [transactions, searchParams, setSearchParams]);

  // ==================================================
  // Delete Transaction
  // ==================================================

  function handleDeleteTransaction(transaction) {
    setError("");

    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  }

  // ==================================================
  // Confirm Delete
  // ==================================================

  async function confirmDeleteTransaction() {
    if (!transactionToDelete || deleting) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await apiRequest(
        `/transactions/${transactionToDelete._id}`,
        {
          method: "DELETE",
        },
      );

      // Refresh transaction page
      await loadTransactions(false);

      // Close delete modal
      setShowDeleteModal(false);
      setTransactionToDelete(null);

      // IMPORTANT:
      // Tell Dashboard that transaction was deleted
      notifyTransactionsUpdated();
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // ==================================================
  // Add New Category
  // ==================================================

  async function handleAddCategory() {
    setError("");

    const categoryName = newCategoryName.trim();

    if (!categoryName) {
      setError("Category name is required.");
      return;
    }

    try {
      const data = await apiRequest("/categories", {
        method: "POST",

        body: JSON.stringify({
          name: categoryName,
          type: formData.type,
        }),
      });

      await loadCategories();

      setFormData((previousData) => ({
        ...previousData,
        category: data.category._id,
      }));

      setShowCategoryForm(false);
      setNewCategoryName("");
    } catch (error) {
      setError(error.message);
    }
  }

  // ==================================================
  // Submit Transaction
  // ==================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    // Frontend validation
    if (
      !formData.title.trim() ||
      !formData.amount ||
      !formData.category ||
      !formData.paymentMethod
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);

    try {
      const transactionData = {
        title: formData.title.trim(),

        amount,

        type: formData.type,

        category: formData.category,

        paymentMethod: formData.paymentMethod,

        // If no date is selected, don't send undefined.
        // Backend can then use its default date.
        ...(formData.date
          ? { date: formData.date }
          : {}),

        ...(formData.note.trim()
          ? { note: formData.note.trim() }
          : {}),
      };

      // ==================================================
      // EDIT
      // ==================================================

      if (editingTransaction) {
        await apiRequest(
          `/transactions/${editingTransaction._id}`,
          {
            method: "PUT",
            body: JSON.stringify(transactionData),
          },
        );
      }

      // ==================================================
      // ADD
      // ==================================================

      else {
        await apiRequest("/transactions", {
          method: "POST",
          body: JSON.stringify(transactionData),
        });
      }

      // Refresh Transactions page
      await loadTransactions(false);

      // Close form
      setShowForm(false);

      // Reset form
      resetForm();

      // Remove ?edit=... from URL
      setSearchParams({});

      // ==================================================
      // IMPORTANT
      // Tell Dashboard that transaction changed
      // ==================================================

      notifyTransactionsUpdated();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ==================================================
  // Filter Categories By Type
  // ==================================================

  const filteredCategories = categories.filter(
    (category) => category.type === formData.type,
  );

  // ==================================================
  // Close Transaction Form
  // ==================================================

  function closeForm() {
    if (submitting) {
      return;
    }

    setShowForm(false);
    resetForm();
    setError("");
    setSearchParams({});
  }

  // ==================================================
  // Loading
  // ==================================================

  if (loading) {
    return <h1>Loading transactions...</h1>;
  }

  // ==================================================
  // Error
  // ==================================================

  if (error && !showForm && !showDeleteModal) {
    return <h1>{error}</h1>;
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="transactions-page">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="transactions-header">
        <h1>Transactions</h1>

        <p>
          Manage your income and expenses.
        </p>
      </div>

      {/* ==================================================
          ADD BUTTON
          ================================================== */}

      <button
        type="button"
        onClick={handleAddTransaction}
      >
        + Add Transaction
      </button>

      {/* ==================================================
          TRANSACTION LIST
          ================================================== */}

      <div className="transactions-list">

        {transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          transactions.map((transaction) => (
            <div
              className="transaction-item"
              key={transaction._id}
            >
              <div>
                <h3>
                  {transaction.title}
                </h3>

                <p>
                  {transaction.category?.name ||
                    "Unknown category"}

                  {" · "}

                  {transaction.paymentMethod}
                </p>
              </div>

              <div>
                <strong>
                  {transaction.type === "income"
                    ? "+"
                    : "-"}
                  ₹
                  {Number(
                    transaction.amount,
                  ).toLocaleString("en-IN")}
                </strong>

                {/* Edit */}

                <button
                  type="button"
                  title="Edit transaction"
                  onClick={() =>
                    handleEditTransaction(
                      transaction,
                    )
                  }
                >
                  <Pencil size={18} />
                </button>

                {/* Delete */}

                <button
                  type="button"
                  title="Delete transaction"
                  onClick={() =>
                    handleDeleteTransaction(
                      transaction,
                    )
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}

      </div>

      {/* ==================================================
          ADD / EDIT MODAL
          ================================================== */}

      {showForm && (
        <div className="transaction-form">

          <div className="transaction-form-card">

            {/* Close */}

            <button
              type="button"
              className="modal-close"
              onClick={closeForm}
            >
              ×
            </button>

            {/* Title */}

            <h2>
              {editingTransaction
                ? "Edit Transaction"
                : "Add Transaction"}
            </h2>

            {/* Error */}

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>

              {/* ==================================================
                  TITLE
                  ================================================== */}

              <div className="form-group">

                <label>
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter transaction title"
                />

              </div>

              {/* ==================================================
                  AMOUNT
                  ================================================== */}

              <div className="form-group">

                <label>
                  Amount
                </label>

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

              {/* ==================================================
                  TYPE
                  ================================================== */}

              <div className="form-group">

                <label>
                  Type
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={(event) => {

                    setFormData(
                      (previousData) => ({
                        ...previousData,

                        type:
                          event.target.value,

                        category: "",
                      }),
                    );

                    setShowCategoryForm(false);
                    setNewCategoryName("");
                  }}
                >

                  <option value="expense">
                    Expense
                  </option>

                  <option value="income">
                    Income
                  </option>

                </select>

              </div>

              {/* ==================================================
                  CATEGORY
                  ================================================== */}

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={(event) => {

                    const value =
                      event.target.value;

                    if (value === "other") {

                      setShowCategoryForm(true);

                      setFormData(
                        (previousData) => ({
                          ...previousData,
                          category: "",
                        }),
                      );

                      return;
                    }

                    setFormData(
                      (previousData) => ({
                        ...previousData,
                        category: value,
                      }),
                    );

                    setShowCategoryForm(false);
                  }}
                >

                  <option value="">
                    Select category
                  </option>

                  {filteredCategories.map(
                    (category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    ),
                  )}

                  <option value="other">
                    Other → Add new category
                  </option>

                </select>

                {/* Add Category */}

                {showCategoryForm && (
                  <div className="add-category-form">

                    <label>
                      New Category
                    </label>

                    <input
                      type="text"
                      value={
                        newCategoryName
                      }
                      onChange={(event) =>
                        setNewCategoryName(
                          event.target.value,
                        )
                      }
                      placeholder="Enter category name"
                    />

                    <div>

                      <button
                        type="button"
                        onClick={
                          handleAddCategory
                        }
                      >
                        Add Category
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(
                            false,
                          );

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

              {/* ==================================================
                  PAYMENT METHOD
                  ================================================== */}

              <div className="form-group">

                <label>
                  Payment Method
                </label>

                <select
                  name="paymentMethod"
                  value={
                    formData.paymentMethod
                  }
                  onChange={handleChange}
                >

                  <option value="">
                    Select payment method
                  </option>

                  <option value="Debit Card">
                    Debit Card
                  </option>

                  <option value="Credit Card">
                    Credit Card
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="Card">
                    Card
                  </option>

                  <option value="Bank Transfer">
                    Bank Transfer
                  </option>

                </select>

              </div>

              {/* ==================================================
                  DATE
                  ================================================== */}

              <div className="form-group">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />

              </div>

              {/* ==================================================
                  NOTE
                  ================================================== */}

              <div className="form-group">

                <label>
                  Note
                </label>

                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Optional note"
                />

              </div>

              {/* ==================================================
                  BUTTONS
                  ================================================== */}

              <div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                >

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

      {/* ==================================================
          DELETE MODAL
          ================================================== */}

      {showDeleteModal &&
        transactionToDelete && (

          <div className="delete-modal-overlay">

            <div className="delete-modal">

              <div className="delete-modal-icon">
                <Trash2 size={24} />
              </div>

              <h2>
                Delete Transaction?
              </h2>

              <p>
                Are you sure you want to delete{" "}
                <strong>
                  "{transactionToDelete.title}"
                </strong>
                ?
              </p>

              <p className="delete-modal-warning">
                This transaction will be removed
                from your transaction list.
              </p>

              {error && (
                <p className="form-error">
                  {error}
                </p>
              )}

              <div className="delete-modal-actions">

                <button
                  type="button"
                  onClick={() => {
                    if (deleting) {
                      return;
                    }

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
                  onClick={
                    confirmDeleteTransaction
                  }
                  disabled={deleting}
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete"}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Transactions;