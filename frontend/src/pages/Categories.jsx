import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";

import {
  Pencil,
  Trash2,
  Plus,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Layers,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

// ==================================================
// PIE CHART COLORS
// ==================================================

const PIE_COLORS = [
  "#7c3aed",
  "#f97316",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#6366f1",
  "#14b8a6",
];

function Categories() {
  // ==================================================
  // STATE
  // ==================================================

  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================================================
  // ADD / EDIT FORM STATE
  // ==================================================

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // ==================================================
  // DELETE STATE
  // ==================================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ==================================================
  // CATEGORY FORM DATA
  // ==================================================

  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
  });

  // ==================================================
  // CHART FILTERS
  // ==================================================

  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    now.getMonth() + 1,
  );

  const [selectedYear, setSelectedYear] = useState(
    now.getFullYear(),
  );

  const [chartType, setChartType] = useState("expense");

  // ==================================================
  // NAVIGATION
  // ==================================================

  const navigate = useNavigate();
  const location = useLocation();

  // ==================================================
  // TRANSACTION -> CATEGORY FLOW
  // ==================================================

  const fromTransaction = location.state?.from === "transaction";

  const transactionFormData =
    location.state?.transactionFormData || null;

  // ==================================================
  // MONTH / YEAR HELPERS
  // ==================================================

  const monthNames = [
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

  const availableYears = [];

  for (
    let year = now.getFullYear();
    year >= now.getFullYear() - 5;
    year--
  ) {
    availableYears.push(year);
  }

  // ==================================================
  // LOAD CATEGORIES
  // ==================================================

  async function loadCategories() {
    try {
      const data = await apiRequest("/categories");
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    }
  }

  // ==================================================
  // LOAD TRANSACTIONS
  // ==================================================

  async function loadTransactions() {
    try {
      const data = await apiRequest("/transactions", {
        cache: "no-store",
      });
      setTransactions(data.transactions || []);
    } catch {
      // Non-critical — pie chart just won't show data.
    }
  }

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadCategories(),
          loadTransactions(),
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ==================================================
  // OPEN FORM ONLY WHEN COMING FROM TRANSACTION
  // ==================================================
  //
  // Important:
  //
  // Normal /categories page:
  //     Form stays hidden.
  //
  // Transaction -> Other -> Add new category:
  //     Categories page opens with Add Category form.
  //
  // ==================================================

  useEffect(() => {
    if (!fromTransaction) {
      return;
    }

    setEditingCategory(null);

    setFormData({
      name: "",
      type: transactionFormData?.type || "expense",
    });

    setError("");
    setShowForm(true);
  }, [fromTransaction]);

  // ==================================================
  // SUMMARY DATA
  // ==================================================

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories],
  );

  const customCategories = useMemo(
    () => categories.filter((c) => !c.isDefault),
    [categories],
  );

  // ==================================================
  // PIE CHART DATA
  // ==================================================

  const pieChartData = useMemo(() => {
    // Filter transactions for selected month/year and type
    const filtered = transactions.filter((t) => {
      if (!t.date) return false;

      const d = new Date(t.date);

      if (Number.isNaN(d.getTime())) return false;

      return (
        d.getFullYear() === selectedYear &&
        d.getMonth() + 1 === selectedMonth &&
        t.type === chartType
      );
    });

    // Group by category
    const map = {};

    filtered.forEach((t) => {
      const catName =
        t.category?.name || "Unknown";
      const catId =
        t.category?._id || "unknown";

      if (!map[catId]) {
        map[catId] = {
          name: catName,
          value: 0,
        };
      }

      map[catId].value += Number(t.amount || 0);
    });

    return Object.values(map)
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedMonth, selectedYear, chartType]);

  const totalPieValue = useMemo(
    () => pieChartData.reduce((sum, d) => sum + d.value, 0),
    [pieChartData],
  );

  // ==================================================
  // HANDLE FORM CHANGE
  // ==================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==================================================
  // OPEN ADD CATEGORY FORM
  // ==================================================

  function handleAddCategory() {
    setError("");
    setEditingCategory(null);

    setFormData({
      name: "",
      type: "expense",
    });

    setShowForm(true);
  }

  // ==================================================
  // RETURN TO TRANSACTION
  // ==================================================

  function returnToTransaction(categoryId = null) {
    navigate("/transactions", {
      state: {
        transactionFormData: {
          ...(transactionFormData || {}),

          ...(categoryId
            ? {
                category: categoryId,
              }
            : {}),
        },
      },
    });
  }

  // ==================================================
  // CLOSE ADD / EDIT FORM
  // ==================================================

  function closeForm() {
    /*
     * If this form was opened from Transaction:
     *
     * Cancel -> return to Transaction
     */

    if (fromTransaction && !editingCategory) {
      returnToTransaction();
      return;
    }

    /*
     * Normal Categories page:
     *
     * Cancel -> stay on Categories page
     */

    setShowForm(false);
    setEditingCategory(null);
    setError("");

    setFormData({
      name: "",
      type: "expense",
    });
  }

  // ==================================================
  // OPEN EDIT CATEGORY
  // ==================================================

  function handleEditCategory(category) {
    setError("");

    setEditingCategory(category);

    setFormData({
      name: category.name,
      type: category.type,
    });

    setShowForm(true);
  }

  // ==================================================
  // ADD / EDIT CATEGORY
  // ==================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    const categoryName = formData.name.trim();

    if (!categoryName) {
      setError("Category name is required.");
      return;
    }

    setSubmitting(true);

    try {
      // ==================================================
      // EDIT CATEGORY
      // ==================================================

      if (editingCategory) {
        await apiRequest(`/categories/${editingCategory._id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: categoryName,
            type: formData.type,
          }),
        });

        await loadCategories();

        setShowForm(false);
        setEditingCategory(null);

        setFormData({
          name: "",
          type: "expense",
        });

        return;
      }

      // ==================================================
      // ADD CATEGORY
      // ==================================================

      const data = await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify({
          name: categoryName,
          type: formData.type,
        }),
      });

      await loadCategories();

      // ==================================================
      // IF COMING FROM TRANSACTION
      // ==================================================
      //
      // Return to transaction and automatically select
      // the newly created category.
      //
      // ==================================================

      if (fromTransaction) {
        returnToTransaction(data.category._id);
        return;
      }

      // ==================================================
      // NORMAL CATEGORY PAGE
      // ==================================================
      //
      // Stay on Categories page.
      //
      // ==================================================

      setShowForm(false);
      setEditingCategory(null);

      setFormData({
        name: "",
        type: "expense",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ==================================================
  // OPEN DELETE MODAL
  // ==================================================

  function handleDeleteClick(category) {
    setError("");
    setDeleteError("");

    setDeletingCategory(category);
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
    setDeletingCategory(null);
    setDeleteError("");
  }

  // ==================================================
  // DELETE CATEGORY
  // ==================================================

  async function handleDeleteCategory() {
    if (!deletingCategory || deleting) {
      return;
    }

    setDeleteError("");
    setDeleting(true);

    try {
      await apiRequest(`/categories/${deletingCategory._id}`, {
        method: "DELETE",
      });

      await loadCategories();

      setShowDeleteModal(false);
      setDeletingCategory(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ==================================================
  // CUSTOM PIE TOOLTIP
  // ==================================================

  function CustomPieTooltip({ active, payload }) {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const data = payload[0];
    const percentage =
      totalPieValue > 0
        ? ((data.value / totalPieValue) * 100).toFixed(1)
        : "0";

    return (
      <div className="cat-pie-tooltip">
        <p className="cat-pie-tooltip-name">
          {data.name}
        </p>

        <p className="cat-pie-tooltip-value">
          ₹{Number(data.value).toLocaleString("en-IN")}
        </p>

        <p className="cat-pie-tooltip-percent">
          {percentage}%
        </p>
      </div>
    );
  }

  // ==================================================
  // LOADING SKELETON
  // ==================================================

  if (loading) {
    return (
      <div className="categories-page categories-page-loading">

        {/* HEADER SKELETON */}

        <div className="categories-header">
          <div className="cat-header-skeleton-content">
            <div className="skeleton-text cat-skeleton-label" />
            <div className="skeleton-text cat-skeleton-title" />
            <div className="skeleton-text cat-skeleton-description" />
          </div>

          <div className="cat-skeleton-add-button" />
        </div>

        {/* SUMMARY SKELETON */}

        <div className="categories-summary-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="cat-summary-card cat-summary-skeleton"
            >
              <div className="cat-summary-skeleton-icon" />

              <div className="cat-summary-skeleton-content">
                <div className="skeleton-text cat-summary-skeleton-label" />
                <div className="skeleton-text cat-summary-skeleton-value" />
              </div>
            </div>
          ))}
        </div>

        {/* CHART SKELETON */}

        <section className="cat-chart-section cat-chart-skeleton">
          <div className="cat-chart-skeleton-circle" />
        </section>

        {/* CATEGORY LIST SKELETON */}

        <div className="categories-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="category-card category-card-skeleton"
            >
              <div className="cat-card-skeleton-header">
                <div className="cat-card-skeleton-icon" />

                <div>
                  <div className="skeleton-text cat-card-skeleton-name" />
                  <div className="skeleton-text cat-card-skeleton-type" />
                </div>
              </div>

              <div className="cat-card-skeleton-badge" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="categories-page">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="categories-header">
        <div>
          <span className="categories-label">
            ORGANIZATION
          </span>

          <h1>Categories</h1>

          <p>
            Manage your expense and income categories.
          </p>
        </div>

        <button
          type="button"
          className="categories-add-button"
          onClick={handleAddCategory}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* ==================================================
          PAGE ERROR
          ================================================== */}

      {error && !showForm && !showDeleteModal && (
        <p className="cat-page-error">
          {error}
        </p>
      )}

      {/* ==================================================
          SUMMARY CARDS
          ================================================== */}

      <div className="categories-summary-grid">

        {/* Expense Categories */}

        <div className="cat-summary-card cat-summary-expense">
          <div className="cat-summary-icon">
            <ArrowDownRight size={20} />
          </div>

          <div>
            <span>Expense Categories</span>
            <h2>{expenseCategories.length}</h2>
          </div>
        </div>

        {/* Income Categories */}

        <div className="cat-summary-card cat-summary-income">
          <div className="cat-summary-icon">
            <ArrowUpRight size={20} />
          </div>

          <div>
            <span>Income Categories</span>
            <h2>{incomeCategories.length}</h2>
          </div>
        </div>

        {/* Custom Categories */}

        <div className="cat-summary-card cat-summary-custom">
          <div className="cat-summary-icon">
            <Layers size={20} />
          </div>

          <div>
            <span>Custom Categories</span>
            <h2>{customCategories.length}</h2>
          </div>
        </div>
      </div>

      {/* ==================================================
          PIE CHART SECTION
          ================================================== */}

      <section className="cat-chart-section">

        <div className="cat-chart-header">
          <div>
            <span className="statistics-small-title">
              BREAKDOWN
            </span>

            <h2>
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h2>

            <p>
              Category-wise {chartType} distribution.
            </p>
          </div>

          <div className="cat-chart-filters">

            {/* Month */}

            <label className="month-selector">
              <select
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(Number(e.target.value))
                }
              >
                {monthNames.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <ChevronDown size={16} />
            </label>

            {/* Year */}

            <label className="month-selector">
              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(Number(e.target.value))
                }
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <ChevronDown size={16} />
            </label>
          </div>
        </div>

        {/* EXPENSE / INCOME TOGGLE */}

        <div className="transaction-toggle">
          <button
            type="button"
            className={
              chartType === "expense" ? "active" : ""
            }
            onClick={() => setChartType("expense")}
          >
            Expenses
          </button>

          <button
            type="button"
            className={
              chartType === "income" ? "active" : ""
            }
            onClick={() => setChartType("income")}
          >
            Income
          </button>
        </div>

        {/* PIE CHART */}

        {pieChartData.length === 0 ? (
          <div className="cat-chart-empty">
            <p>
              No {chartType} transactions found for{" "}
              {monthNames[selectedMonth - 1]}.
            </p>
          </div>
        ) : (
          <div className="cat-pie-container">
            <div className="cat-pie-chart">
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          PIE_COLORS[
                            index % PIE_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    content={<CustomPieTooltip />}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* CENTER TOTAL */}

              <div className="cat-pie-center">
                <span className="cat-pie-center-label">
                  Total
                </span>

                <span className="cat-pie-center-value">
                  ₹{totalPieValue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* LEGEND */}

            <div className="cat-pie-legend">
              {pieChartData.map((item, index) => {
                const percent =
                  totalPieValue > 0
                    ? (
                        (item.value / totalPieValue) *
                        100
                      ).toFixed(1)
                    : "0";

                return (
                  <div
                    key={item.name}
                    className="cat-pie-legend-item"
                  >
                    <span
                      className="cat-pie-legend-dot"
                      style={{
                        background:
                          PIE_COLORS[
                            index % PIE_COLORS.length
                          ],
                      }}
                    />

                    <span className="cat-pie-legend-name">
                      {item.name}
                    </span>

                    <span className="cat-pie-legend-value">
                      ₹
                      {item.value.toLocaleString(
                        "en-IN",
                      )}
                    </span>

                    <span className="cat-pie-legend-percent">
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ==================================================
          CATEGORY LIST
          ================================================== */}

      <section className="cat-list-section">

        <div className="cat-list-heading">
          <span className="statistics-small-title">
            ALL CATEGORIES
          </span>

          <h2>Your Categories</h2>

          <p>
            {categories.length} categories total.
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((category) => (
            <div
              className="category-card"
              key={category._id}
            >
              <div className="category-card-top">
                <div
                  className={
                    category.type === "expense"
                      ? "category-card-icon expense-cat-icon"
                      : "category-card-icon income-cat-icon"
                  }
                >
                  <Tag size={18} />
                </div>

                <div className="category-card-info">
                  <h3>{category.name}</h3>

                  <span
                    className={
                      category.type === "expense"
                        ? "category-type-badge expense-badge"
                        : "category-type-badge income-badge"
                    }
                  >
                    {category.type === "expense"
                      ? "Expense"
                      : "Income"}
                  </span>
                </div>
              </div>

              <div className="category-card-bottom">
                {category.isDefault ? (
                  <span className="category-default-badge">
                    Default
                  </span>
                ) : (
                  <span className="category-custom-badge">
                    Custom
                  </span>
                )}

                {!category.isDefault && (
                  <div className="category-card-actions">
                    {/* EDIT */}

                    <button
                      type="button"
                      title="Edit category"
                      className="action-btn edit-btn"
                      onClick={() =>
                        handleEditCategory(category)
                      }
                    >
                      <Pencil size={16} />
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      title="Delete category"
                      className="action-btn delete-btn"
                      onClick={() =>
                        handleDeleteClick(category)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================
          ADD / EDIT CATEGORY FORM (MODAL)
          ================================================== */}

      {showForm && (
        <div className="modal-overlay">
          <div className="transaction-form">

            {/* CLOSE */}

            <button
              type="button"
              className="modal-close"
              onClick={closeForm}
              disabled={submitting}
            >
              ×
            </button>

            {/* HEADER */}

            <div className="transaction-form-header">
              <span className="form-label">
                {editingCategory
                  ? "EDIT CATEGORY"
                  : "NEW CATEGORY"}
              </span>

              <h2>
                {editingCategory
                  ? "Edit Category"
                  : "Add Category"}
              </h2>

              <p>
                {editingCategory
                  ? "Update this category's details."
                  : "Create a new category for your transactions."}
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>

              {/* CATEGORY NAME */}

              <div className="form-group">
                <label>
                  Category Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
                  autoFocus
                  disabled={submitting}
                />
              </div>

              {/* CATEGORY TYPE */}

              <div className="form-group">
                <label>
                  Type
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="expense">
                    Expense
                  </option>

                  <option value="income">
                    Income
                  </option>
                </select>
              </div>

              {/* BUTTONS */}

              <div className="transaction-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeForm}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? editingCategory
                      ? "Updating..."
                      : "Adding..."
                    : editingCategory
                      ? "Update Category"
                      : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          DELETE MODAL
          ================================================== */}

      {showDeleteModal && deletingCategory && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">

            <div className="delete-modal-icon">
              <Trash2 size={24} />
            </div>

            {deleteError ? (
              <>
                <h2>
                  Cannot Delete Category
                </h2>

                <p className="form-error">
                  {deleteError}
                </p>

                <div className="delete-modal-actions">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>
                  Delete Category?
                </h2>

                <p>
                  Are you sure you want to delete{" "}
                  <strong>
                    "{deletingCategory.name}"
                  </strong>
                  ?
                </p>

                <p className="delete-modal-warning">
                  If this category is being used by
                  transactions, the deletion will be
                  prevented.
                </p>

                <div className="delete-modal-actions">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="delete-confirm-button"
                    onClick={handleDeleteCategory}
                    disabled={deleting}
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;