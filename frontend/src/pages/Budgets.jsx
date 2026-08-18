import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { apiRequest } from "../services/api.js";

function Budget() {
  const today = new Date();
  const navigate = useNavigate();

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // ==================================================
  // VIEWING PERIOD
  // ==================================================

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  // ==================================================
  // DATA
  // ==================================================

  const [summary, setSummary] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================================================
  // ADD / EDIT FORM
  // ==================================================

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    month: currentMonth,
    year: currentYear,
  });

  // ==================================================
  // DELETE
  // ==================================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==================================================
  // MONTH NAMES
  // ==================================================

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

  // ==================================================
  // AVAILABLE YEARS
  // ==================================================

  const years = [];

  for (
    let i = currentYear - 5;
    i <= currentYear + 5;
    i++
  ) {
    years.push(i);
  }

  // ==================================================
  // LOAD BUDGET SUMMARY
  // ==================================================

  async function loadBudgetSummary(
    selectedMonth = month,
    selectedYear = year,
  ) {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        `/budgets/summary?month=${selectedMonth}&year=${selectedYear}`;

      const data = await apiRequest(endpoint);

      setSummary(data.summary || []);
    } catch (err) {
      setError(
        err.message || "Failed to load budgets.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // LOAD CATEGORIES
  // ==================================================

  async function loadCategories() {
    try {
      const data = await apiRequest("/categories", {
        cache: "no-store",
      });

      const expenseCategories = (
        data.categories || []
      ).filter(
        (category) =>
          category.type === "expense",
      );

      setCategories(expenseCategories);

      return expenseCategories;
    } catch (err) {
      setError(
        err.message ||
          "Failed to load categories.",
      );

      throw err;
    }
  }

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    async function loadInitialData() {
      try {
        await Promise.all([
          loadCategories(),
          loadBudgetSummary(
            currentMonth,
            currentYear,
          ),
        ]);
      } catch {
        // Error already handled.
      }
    }

    loadInitialData();
  }, []);

  // ==================================================
  // RELOAD WHEN VIEWING MONTH / YEAR CHANGES
  // ==================================================

  useEffect(() => {
    loadBudgetSummary(month, year);
  }, [month, year]);

  // ==================================================
  // HANDLE FORM CHANGE
  // ==================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  // ==================================================
  // OPEN TRANSACTIONS FOR BUDGET
  // ==================================================

  function handleBudgetClick(budget) {
    const categoryId =
      budget.category?._id;

    if (!categoryId) {
      return;
    }

    /*
     * Send the budget's exact:
     *
     * month
     * year
     * category
     * type
     *
     * to Transactions.
     */

    navigate(
      `/transactions?month=${month}&year=${year}&category=${categoryId}&type=expense`,
    );
  }

  // ==================================================
  // ADD BUDGET
  // ==================================================

  async function handleAddBudget() {
    if (submitting) {
      return;
    }

    setError("");
    setEditingBudget(null);

    try {
      await loadCategories();

      /*
       * Add Budget starts with the currently
       * selected viewing month/year.
       *
       * Example:
       * If Budget page is showing August 2026,
       * Add Budget starts with August 2026.
       */

      setFormData({
        category: "",
        amount: "",
        month: month,
        year: year,
      });

      setShowForm(true);
    } catch {
      // Error already handled.
    }
  }

  // ==================================================
  // EDIT BUDGET
  // ==================================================

  function handleEditBudget(budget) {
    setError("");

    setEditingBudget(budget);

    setFormData({
      category:
        budget.category?._id || "",
      amount:
        budget.budgetAmount ?? "",
      month: month,
      year: year,
    });

    setShowForm(true);
  }

  // ==================================================
  // CLOSE FORM
  // ==================================================

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
      month: month,
      year: year,
    });
  }

  // ==================================================
  // SUBMIT ADD / EDIT
  // ==================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    // ----------------------------------------------
    // CATEGORY
    // ----------------------------------------------

    if (!formData.category) {
      setError(
        "Please select a category.",
      );
      return;
    }

    // ----------------------------------------------
    // AMOUNT
    // ----------------------------------------------

    if (
      !formData.amount ||
      Number(formData.amount) <= 0
    ) {
      setError(
        "Budget amount must be greater than 0.",
      );
      return;
    }

    // ----------------------------------------------
    // MONTH
    // ----------------------------------------------

    const budgetMonth =
      Number(formData.month);

    if (
      !Number.isInteger(budgetMonth) ||
      budgetMonth < 1 ||
      budgetMonth > 12
    ) {
      setError(
        "Please select a valid month.",
      );
      return;
    }

    // ----------------------------------------------
    // YEAR
    // ----------------------------------------------

    const budgetYear =
      Number(formData.year);

    if (
      !Number.isInteger(budgetYear) ||
      budgetYear < currentYear - 5 ||
      budgetYear > currentYear + 5
    ) {
      setError(
        "Please select a valid year.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        category: formData.category,
        amount: Number(formData.amount),
        month: budgetMonth,
        year: budgetYear,
      };

      // ============================================
      // EDIT
      // ============================================

      if (editingBudget) {
        await apiRequest(
          `/budgets/${editingBudget.budgetId}`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          },
        );
      }

      // ============================================
      // ADD
      // ============================================

      else {
        await apiRequest(
          "/budgets",
          {
            method: "POST",
            body: JSON.stringify(body),
          },
        );
      }

      // ============================================
      // CLOSE FORM
      // ============================================

      setShowForm(false);
      setEditingBudget(null);

      // ============================================
      // SHOW SAVED PERIOD
      // ============================================

      setMonth(budgetMonth);
      setYear(budgetYear);

      setFormData({
        category: "",
        amount: "",
        month: budgetMonth,
        year: budgetYear,
      });

      setError("");

      // ============================================
      // REFRESH
      // ============================================

      await loadBudgetSummary(
        budgetMonth,
        budgetYear,
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to save budget.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ==================================================
  // DELETE
  // ==================================================

  function handleDeleteClick(budget) {
    setError("");

    setDeletingBudget(budget);
    setShowDeleteModal(true);
  }

  // ==================================================
  // CLOSE DELETE MODAL
  // ==================================================

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setDeletingBudget(null);
    setError("");
  }

  // ==================================================
  // DELETE BUDGET
  // ==================================================

  async function handleDeleteBudget() {
    if (
      !deletingBudget ||
      deleting
    ) {
      return;
    }

    setError("");
    setDeleting(true);

    try {
      await apiRequest(
        `/budgets/${deletingBudget.budgetId}`,
        {
          method: "DELETE",
        },
      );

      setShowDeleteModal(false);
      setDeletingBudget(null);

      await loadBudgetSummary(
        month,
        year,
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to delete budget.",
      );
    } finally {
      setDeleting(false);
    }
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
  return (
    <div className="budget-page budget-page-loading">

      {/* ==================================================
          HEADER SKELETON
          Matches the real budget-header
          ================================================== */}

      <div className="budget-header">

        <div className="budget-header-content-skeleton">

          <div className="skeleton-text skeleton-label" />

          <div className="skeleton-text skeleton-budget-title" />

          <div className="skeleton-text skeleton-budget-description" />

        </div>

        <div className="skeleton-budget-button" />

      </div>

      {/* ==================================================
          MONTH / YEAR SKELETON
          ================================================== */}

      <div className="budget-period">

        <div className="form-group">

          <div className="skeleton-text skeleton-form-label" />

          <div className="skeleton-select-budget" />

        </div>

        <div className="form-group">

          <div className="skeleton-text skeleton-form-label" />

          <div className="skeleton-select-budget" />

        </div>

      </div>

      {/* ==================================================
          CURRENT PERIOD SKELETON
          ================================================== */}

      <div className="budget-current-period">

        <div className="skeleton-text skeleton-current-period" />

      </div>

      {/* ==================================================
          BUDGET CARDS SKELETON
          ================================================== */}

      <div className="budget-list budget-list-loading">

        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="budget-card budget-card-skeleton"
            key={index}
          >

            {/* CARD HEADER */}

            <div className="budget-card-header">

              <div className="budget-card-title-skeleton">

                <div className="skeleton-text skeleton-category-name" />

                <div className="skeleton-text skeleton-category-period" />

              </div>

              <div className="budget-actions">

                <div className="skeleton-icon-button" />

                <div className="skeleton-icon-button" />

              </div>

            </div>

            {/* AMOUNTS */}

            <div className="budget-amounts">

              <div className="budget-amount-skeleton">

                <div className="skeleton-text skeleton-amount-label" />

                <div className="skeleton-text skeleton-amount-value" />

              </div>

              <div className="budget-amount-skeleton">

                <div className="skeleton-text skeleton-amount-label" />

                <div className="skeleton-text skeleton-amount-value" />

              </div>

              <div className="budget-amount-skeleton">

                <div className="skeleton-text skeleton-amount-label" />

                <div className="skeleton-text skeleton-amount-value" />

              </div>

            </div>

            {/* PROGRESS */}

            <div className="budget-progress">

              <div className="budget-progress-header">

                <div className="skeleton-text skeleton-progress-label" />

                <div className="skeleton-text skeleton-progress-percentage" />

              </div>

              <div className="budget-progress-track skeleton-progress-track">

                <div className="skeleton-progress-fill" />

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}
  // ==================================================
  // IMPORTANT:
  // GET BUDGETED CATEGORY IDS
  //
  // summary belongs to the currently selected
  // month/year.
  //
  // Therefore when viewing August 2026,
  // these are only August 2026 budgets.
  // ==================================================

  const budgetedCategoryIds =
    summary
      .map(
        (budget) =>
          budget.category?._id,
      )
      .filter(Boolean);

  // ==================================================
  // AVAILABLE CATEGORIES
  // ==================================================

  /*
   * For ADD:
   *
   * Only categories without a budget in the
   * currently viewed month/year are shown.
   *
   * Since the Add form starts with the same
   * month/year as the Budget page, this works
   * correctly for the normal case.
   *
   * For EDIT:
   * Keep the existing category available.
   */

  const availableCategories =
    categories.filter((category) => {
      if (editingBudget) {
        return (
          category._id ===
          editingBudget.category?._id
        );
      }

      return !budgetedCategoryIds.includes(
        category._id,
      );
    });

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="budget-page">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="budget-header">

        <div>
          <span className="form-label">
            FINANCIAL PLANNING
          </span>

          <h1>Budget</h1>

          <p>
            Manage your category-wise
            monthly budgets.
          </p>
        </div>

        {/* ALWAYS VISIBLE */}

        <button
          type="button"
          className="add-budget-button"
          onClick={handleAddBudget}
          disabled={submitting}
        >
          <Plus size={18} />
          Add Budget
        </button>

      </div>

      {/* ==================================================
          MONTH / YEAR
          ================================================== */}

      <div className="budget-period">

        {/* MONTH */}

        <div className="form-group">
          <label>
            Month
          </label>

          <select
            value={month}
            onChange={(event) =>
              setMonth(
                Number(
                  event.target.value,
                ),
              )
            }
          >
            {months.map(
              (
                monthName,
                index,
              ) => (
                <option
                  key={monthName}
                  value={index + 1}
                >
                  {monthName}
                </option>
              ),
            )}
          </select>
        </div>

        {/* YEAR */}

        <div className="form-group">
          <label>
            Year
          </label>

          <select
            value={year}
            onChange={(event) =>
              setYear(
                Number(
                  event.target.value,
                ),
              )
            }
          >
            {years.map(
              (yearValue) => (
                <option
                  key={yearValue}
                  value={yearValue}
                >
                  {yearValue}
                </option>
              ),
            )}
          </select>
        </div>

      </div>

      {/* ==================================================
          CURRENT PERIOD
          ================================================== */}

      <div className="budget-current-period">
        {months[month - 1]} {year}
      </div>

      {/* ==================================================
          ERROR
          ================================================== */}

      {error &&
        !showForm &&
        !showDeleteModal && (
          <p className="form-error">
            {error}
          </p>
        )}

      {/* ==================================================
          BUDGET LIST
          ================================================== */}

      <div className="budget-list">

        {summary.length === 0 ? (

          <div className="budget-empty">

            <h2>
              No budgets yet
            </h2>

            <p>
              No budgets have been
              created for{" "}
              <strong>
                {months[month - 1]}{" "}
                {year}
              </strong>
              .
            </p>

            <button
              type="button"
              onClick={
                handleAddBudget
              }
            >
              <Plus size={18} />
              Add Budget
            </button>

          </div>

        ) : (

          summary.map(
            (budget) => {

              const percentage =
                Number(
                  budget.percentage,
                ) || 0;

              const progress =
                Math.min(
                  Math.max(
                    percentage,
                    0,
                  ),
                  100,
                );

              const budgetAmount =
                Number(
                  budget.budgetAmount,
                ) || 0;

              const spent =
                Number(
                  budget.spent,
                ) || 0;

              const remaining =
                Number(
                  budget.remaining,
                ) || 0;

              return (
                <div
                  className="budget-card"
                  key={
                    budget.budgetId
                  }
                  onClick={() =>
                    handleBudgetClick(
                      budget,
                    )
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                        "Enter" ||
                      event.key ===
                        " "
                    ) {
                      event.preventDefault();

                      handleBudgetClick(
                        budget,
                      );
                    }
                  }}
                >

                  {/* CARD HEADER */}

                  <div className="budget-card-header">

                    <div>
                      <h2>
                        {
                          budget
                            .category
                            ?.name
                        }
                      </h2>

                      <p>
                        {
                          months[
                            month - 1
                          ]
                        }{" "}
                        {year}
                      </p>
                    </div>

                    <div className="budget-actions">

                      <button
                        type="button"
                        title="Edit budget"
                        onClick={(
                          event,
                        ) => {
                          event.stopPropagation();

                          handleEditBudget(
                            budget,
                          );
                        }}
                      >
                        <Pencil
                          size={18}
                        />
                      </button>

                      <button
                        type="button"
                        title="Delete budget"
                        onClick={(
                          event,
                        ) => {
                          event.stopPropagation();

                          handleDeleteClick(
                            budget,
                          );
                        }}
                      >
                        <Trash2
                          size={18}
                        />
                      </button>

                    </div>

                  </div>

                  {/* AMOUNTS */}

                  <div className="budget-amounts">

                    <div>
                      <span>
                        Budget
                      </span>

                      <strong>
                        ₹
                        {budgetAmount.toLocaleString(
                          "en-IN",
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Spent
                      </span>

                      <strong>
                        ₹
                        {spent.toLocaleString(
                          "en-IN",
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {remaining >=
                        0
                          ? "Remaining"
                          : "Exceeded"}
                      </span>

                      <strong>
                        ₹
                        {Math.abs(
                          remaining,
                        ).toLocaleString(
                          "en-IN",
                        )}
                      </strong>
                    </div>

                  </div>

                  {/* PROGRESS */}

                  <div className="budget-progress">

                    <div className="budget-progress-header">

                      <span>
                        Progress
                      </span>

                      <span>
                        {Math.round(
                          percentage,
                        )}
                        %
                      </span>

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

                  {/* WARNING */}

                  {budget.exceeded && (
                    <p className="budget-warning">
                      Budget exceeded by ₹
                      {Math.abs(
                        remaining,
                      ).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  )}

                </div>
              );
            },
          )
        )}

      </div>

      {/* ==================================================
          ADD / EDIT MODAL
          ================================================== */}

      {showForm && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >

          <div className="transaction-form">

            {/* CLOSE */}

            <button
              type="button"
              className="modal-close"
              onClick={closeForm}
              disabled={
                submitting
              }
            >
              <X size={20} />
            </button>

            {/* HEADER */}

            <div className="transaction-form-header">

              <span className="form-label">
                {editingBudget
                  ? "UPDATE BUDGET"
                  : "NEW BUDGET"}
              </span>

              <h2>
                {editingBudget
                  ? "Edit Budget"
                  : "Add Budget"}
              </h2>

              <p>
                {editingBudget
                  ? "Update your budget amount."
                  : "Set a spending limit for a category."}
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  name="category"
                  value={
                    formData.category
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !!editingBudget
                  }
                >

                  <option value="">
                    Select category
                  </option>

                  {availableCategories.map(
                    (category) => (
                      <option
                        key={
                          category._id
                        }
                        value={
                          category._id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    ),
                  )}

                </select>

                {!editingBudget &&
                  availableCategories.length ===
                    0 && (
                    <small>
                      All expense
                      categories
                      already have a
                      budget for{" "}
                      {
                        months[
                          Number(
                            formData.month,
                          ) - 1
                        ]
                      }{" "}
                      {
                        formData.year
                      }
                      .
                    </small>
                  )}

              </div>

              {/* AMOUNT */}

              <div className="form-group">

                <label>
                  Budget Amount
                </label>

                <div className="amount-input-wrapper">

                  <span className="currency-symbol">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="amount"
                    value={
                      formData.amount
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter budget amount"
                    min="1"
                    step="0.01"
                    className="form-input amount-input"
                  />

                </div>

              </div>

              {/* MONTH */}

              <div className="form-group">

                <label>
                  Budget Month
                </label>

                <select
                  name="month"
                  value={
                    formData.month
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !!editingBudget
                  }
                >

                  {months.map(
                    (
                      monthName,
                      index,
                    ) => (
                      <option
                        key={
                          monthName
                        }
                        value={
                          index + 1
                        }
                      >
                        {
                          monthName
                        }
                      </option>
                    ),
                  )}

                </select>

              </div>

              {/* YEAR */}

              <div className="form-group">

                <label>
                  Budget Year
                </label>

                <select
                  name="year"
                  value={
                    formData.year
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !!editingBudget
                  }
                >

                  {years.map(
                    (
                      yearValue,
                    ) => (
                      <option
                        key={
                          yearValue
                        }
                        value={
                          yearValue
                        }
                      >
                        {
                          yearValue
                        }
                      </option>
                    ),
                  )}

                </select>

              </div>

              {/* PERIOD */}

              <div className="budget-form-period">

                Budget period:{" "}

                <strong>
                  {
                    months[
                      Number(
                        formData.month,
                      ) - 1
                    ]
                  }{" "}
                  {
                    formData.year
                  }
                </strong>

              </div>

              {/* BUTTONS */}

              <div className="transaction-form-actions">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    submitting
                  }
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (
                      !editingBudget &&
                      availableCategories.length ===
                        0
                    )
                  }
                  className="btn-primary"
                >
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

      {/* ==================================================
          DELETE MODAL
          ================================================== */}

      {showDeleteModal &&
        deletingBudget && (

          <div
            className="modal-overlay"
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeDeleteModal();
              }
            }}
          >

            <div className="transaction-form">

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deleting
                }
              >
                <X size={20} />
              </button>

              <div className="transaction-form-header">

                <span className="form-label">
                  DELETE BUDGET
                </span>

                <h2>
                  Delete Budget?
                </h2>

                <p>
                  Are you sure you want
                  to delete the{" "}
                  <strong>
                    {
                      deletingBudget
                        .category
                        ?.name
                    }
                  </strong>{" "}
                  budget?
                </p>

              </div>

              <p>
                This will remove the
                budget for{" "}
                <strong>
                  {months[month - 1]}{" "}
                  {year}
                </strong>
                .
              </p>

              {error && (
                <p className="form-error">
                  {error}
                </p>
              )}

              <div className="delete-modal-actions">

                <button
                  type="button"
                  onClick={
                    closeDeleteModal
                  }
                  disabled={
                    deleting
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteBudget
                  }
                  disabled={
                    deleting
                  }
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete Budget"}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default Budget;