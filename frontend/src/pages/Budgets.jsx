import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { apiRequest } from "../services/api.js";

function Budget() {
  const today = new Date();

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // --------------------------------------------------
  // Selected month/year for VIEWING budgets
  // --------------------------------------------------

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [summary, setSummary] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------
  // Add / Edit modal
  // --------------------------------------------------

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    month: currentMonth,
    year: currentYear,
  });

  // --------------------------------------------------
  // Month names
  // --------------------------------------------------

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // --------------------------------------------------
  // Years available for viewing
  // --------------------------------------------------

  const years = [];

  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    years.push(i);
  }

  // --------------------------------------------------
  // Load budget summary
  // --------------------------------------------------

  async function loadBudgetSummary() {
    try {
      setLoading(true);
      setError("");

      const endpoint = "/budgets/summary?month=" + month + "&year=" + year;

      const data = await apiRequest(endpoint);

      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Load expense categories
  // --------------------------------------------------

  async function loadCategories() {
    try {
      const data = await apiRequest("/categories");

      const expenseCategories = data.categories.filter(
        (category) => category.type === "expense",
      );

      setCategories(expenseCategories);
    } catch (err) {
      setError(err.message);
    }
  }

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------

  useEffect(() => {
    loadCategories();
  }, []);

  // --------------------------------------------------
  // Reload when viewing month/year changes
  // --------------------------------------------------

  useEffect(() => {
    loadBudgetSummary();
  }, [month, year]);

  // --------------------------------------------------
  // Handle form changes
  // --------------------------------------------------

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  // --------------------------------------------------
  // Add Budget
  // --------------------------------------------------
  // IMPORTANT:
  // Add always uses the real current month/year.
  // It does NOT use the month currently being viewed.

  function handleAddBudget() {
    setError("");
    setEditingBudget(null);

    const now = new Date();

    const realTimeMonth = now.getMonth() + 1;
    const realTimeYear = now.getFullYear();

    setFormData({
      category: "",
      amount: "",
      month: realTimeMonth,
      year: realTimeYear,
    });

    setShowForm(true);
  }

  // --------------------------------------------------
  // Edit Budget
  // --------------------------------------------------
  // Edit keeps the existing budget's month/year.

  function handleEditBudget(budget) {
    setError("");

    setEditingBudget(budget);

    setFormData({
      category: budget.category._id,
      amount: budget.budgetAmount,
      month,
      year,
    });

    setShowForm(true);
  }

  // --------------------------------------------------
  // Close form
  // --------------------------------------------------

  function closeForm() {
    if (submitting) {
      return;
    }

    setShowForm(false);
    setEditingBudget(null);
    setError("");

    setFormData({
      category: "",
      amount: "",
      month: currentMonth,
      year: currentYear,
    });
  }

  // --------------------------------------------------
  // Add / Edit Budget
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    if (!formData.category) {
      setError("Please select a category.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Budget amount must be greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        category: formData.category,
        amount: Number(formData.amount),
        month: Number(formData.month),
        year: Number(formData.year),
      };

      // Edit existing budget
      if (editingBudget) {
        await apiRequest(`/budgets/${editingBudget.budgetId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }

      // Add new budget
      else {
        await apiRequest("/budgets", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      setShowForm(false);
      setEditingBudget(null);

      // After adding, show the real current month/year.
      // After editing, show the edited budget's month/year.
      setMonth(Number(body.month));
      setYear(Number(body.year));

      await loadBudgetSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------
  // Delete Budget
  // --------------------------------------------------

  function handleDeleteClick(budget) {
    setError("");
    setDeletingBudget(budget);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setDeletingBudget(null);
    setError("");
  }

  async function handleDeleteBudget() {
    if (!deletingBudget || deleting) {
      return;
    }

    setError("");
    setDeleting(true);

    try {
      await apiRequest(`/budgets/${deletingBudget.budgetId}`, {
        method: "DELETE",
      });

      await loadBudgetSummary();

      setShowDeleteModal(false);
      setDeletingBudget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return <h1>Loading budget...</h1>;
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="budget-page">
      {/* Header */}

      <div className="budget-header">
        <div>
          <h1>Budget</h1>

          <p>Manage your category-wise monthly budgets.</p>
        </div>

        
      </div>

      {/* Viewing Period */}

      <div className="budget-period">
        <div className="form-group">
          <label>Month</label>

          <select
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
          >
            {months.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Year</label>

          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {years.map((yearValue) => (
              <option key={yearValue} value={yearValue}>
                {yearValue}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current viewing period */}

      <div className="budget-current-period">
        {months[month - 1]} {year}
      </div>

      {/* Error */}

      {error && !showForm && <p className="form-error">{error}</p>}

      {/* Budget List */}

      <div className="budget-list">
        {summary.length === 0 ? (
          <div className="budget-empty">
            <h2>No budgets yet</h2>

            <p>
              No budgets have been created for {months[month - 1]} {year}.
            </p>

            <button type="button" onClick={handleAddBudget}>
              <Plus size={18} />
              Add Budget
            </button>
          </div>
        ) : (
          summary.map((budget) => {
            const progress = Math.min(budget.percentage, 100);

            return (
              <div className="budget-card" key={budget.budgetId}>
                {/* Card Header */}

                <div className="budget-card-header">
                  <div>
                    <h2>{budget.category.name}</h2>

                    <p>
                      {months[month - 1]} {year}
                    </p>
                  </div>

                  <div className="budget-actions">
                    <button
                      type="button"
                      title="Edit budget"
                      onClick={() => handleEditBudget(budget)}
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      title="Delete budget"
                      onClick={() => handleDeleteClick(budget)}
                    >
                      {" "}
                      <Trash2 size={18} />{" "}
                    </button>
                  </div>
                </div>

                {/* Amounts */}

                <div className="budget-amounts">
                  <div>
                    <span>Budget</span>

                    <strong>
                      ₹{budget.budgetAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div>
                    <span>Spent</span>

                    <strong>₹{budget.spent.toLocaleString("en-IN")}</strong>
                  </div>

                  <div>
                    <span>
                      {budget.remaining >= 0 ? "Remaining" : "Exceeded"}
                    </span>

                    <strong>
                      ₹{Math.abs(budget.remaining).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                {/* Progress */}

                <div className="budget-progress">
                  <div className="budget-progress-header">
                    <span>Progress</span>

                    <span>{budget.percentage}%</span>
                  </div>

                  <div className="budget-progress-track">
                    <div
                      className="budget-progress-bar"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Exceeded */}

                {budget.exceeded && (
                  <p className="budget-warning">
                    Budget exceeded by ₹
                    {Math.abs(budget.remaining).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}

      {showForm && (
        <div className="modal-overlay">
          <div className="transaction-form">
            <button type="button" className="modal-close" onClick={closeForm}>
              ×
            </button>

            <h2>{editingBudget ? "Edit Budget" : "Add Budget"}</h2>

            {error && <p className="form-error">{error}</p>}

            <form onSubmit={handleSubmit}>
              {/* Category */}

              <div className="form-group">
                <label>Category</label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={!!editingBudget}
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}

              <div className="form-group">
                <label>Budget Amount</label>

                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter budget amount"
                  min="1"
                />
              </div>

              {/* Automatically selected period */}

              <div className="form-group">
                <label>Budget Period</label>

                <input
                  type="text"
                  value={`${months[formData.month - 1]} ${formData.year}`}
                  disabled
                  readOnly
                />
              </div>

              {/* Buttons */}

              <div>
                <button type="button" onClick={closeForm} disabled={submitting}>
                  Cancel
                </button>

                <button type="submit" disabled={submitting}>
                  {submitting
                    ? editingBudget
                      ? "Updating..."
                      : "Adding..."
                    : editingBudget
                      ? "Update Budget"
                      : "Add Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && deletingBudget && (
        <div className="modal-overlay">
          {" "}
          <div className="transaction-form">
            {" "}
            {/* Close */}{" "}
            <button
              type="button"
              className="modal-close"
              onClick={closeDeleteModal}
              disabled={deleting}
            >
              {" "}
              ×{" "}
            </button>{" "}
            {/* Title */} <h2>Delete Budget</h2> {/* Message */}{" "}
            <p>
              {" "}
              Are you sure you want to delete{" "}
              <strong> {deletingBudget.category.name} </strong> budget?{" "}
            </p>{" "}
            <p>
              {" "}
              This will remove the budget for{" "}
              <strong>
                {" "}
                {months[month - 1]} {year}{" "}
              </strong>
              .{" "}
            </p>{" "}
            {/* Error */} {error && <p className="form-error"> {error} </p>}{" "}
            {/* Actions */}{" "}
            <div className="delete-modal-actions">
              {" "}
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                {" "}
                Cancel{" "}
              </button>{" "}
              <button
                type="button"
                onClick={handleDeleteBudget}
                disabled={deleting}
              >
                {" "}
                {deleting ? "Deleting..." : "Delete Budget"}{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </div>
  );
}

export default Budget;
