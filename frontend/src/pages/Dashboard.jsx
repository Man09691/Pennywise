import { useEffect, useMemo, useState, useCallback } from "react";

import { useNavigate } from "react-router-dom";

import {
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Plus,
  ChevronDown,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getDashboardSummary } from "../services/dashboardService";
import { apiRequest } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const now = new Date();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  const [transactionType, setTransactionType] = useState("expense");

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [deleting, setDeleting] = useState(false);

  // ==================================================
  // Available Years
  // ==================================================

  const availableYears = [];

  for (
    let year = now.getFullYear();
    year >= now.getFullYear() - 5;
    year--
  ) {
    availableYears.push(year);
  }

  // ==================================================
  // Load Dashboard
  // ==================================================

  const loadDashboard = useCallback(async (showLoader = false) => {
    try {
      setError("");

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const token = localStorage.getItem("token");

      const [summaryData, transactionData] = await Promise.all([
        getDashboardSummary(token),

        apiRequest("/transactions", {
          cache: "no-store",
        }),
      ]);

      setSummary(summaryData.summary);

      setTransactions(transactionData.transactions || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==================================================
  // Initial Dashboard Load
  // ==================================================

  useEffect(() => {
    loadDashboard(true);
  }, [loadDashboard]);

  // ==================================================
  // Refresh When Transactions Change
  // ==================================================

  useEffect(() => {
    function handleTransactionsUpdated() {
      loadDashboard(false);
    }

    window.addEventListener(
      "transactionsUpdated",
      handleTransactionsUpdated,
    );

    return () => {
      window.removeEventListener(
        "transactionsUpdated",
        handleTransactionsUpdated,
      );
    };
  }, [loadDashboard]);

  // ==================================================
  // Refresh When Returning To Dashboard
  // ==================================================

  useEffect(() => {
    function handleFocus() {
      loadDashboard(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadDashboard(false);
      }
    }

    function handlePageShow() {
      loadDashboard(false);
    }

    window.addEventListener("focus", handleFocus);

    window.addEventListener("pageshow", handlePageShow);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener("focus", handleFocus);

      window.removeEventListener("pageshow", handlePageShow);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [loadDashboard]);

  // ==================================================
  // Selected Month
  // ==================================================

  const selectedYear = Number(selectedMonth.split("-")[0]);

  const selectedMonthNumber = Number(selectedMonth.split("-")[1]);

  const monthName = new Date(
    selectedYear,
    selectedMonthNumber - 1,
    1,
  ).toLocaleString("en-IN", {
    month: "long",
  });

  // ==================================================
  // Transactions For Selected Month
  // ==================================================

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (!transaction.date) {
        return false;
      }

      const transactionDate = new Date(transaction.date);

      if (Number.isNaN(transactionDate.getTime())) {
        return false;
      }

      return (
        transactionDate.getFullYear() === selectedYear &&
        transactionDate.getMonth() + 1 === selectedMonthNumber
      );
    });
  }, [transactions, selectedYear, selectedMonthNumber]);

  // ==================================================
  // Weekly Chart Data
  // ==================================================

  const weeklyChartData = useMemo(() => {
    const daysInMonth = new Date(
      selectedYear,
      selectedMonthNumber,
      0,
    ).getDate();

    const numberOfWeeks = Math.ceil(daysInMonth / 7);

    const weeks = [];

    for (let i = 0; i < numberOfWeeks; i++) {
      weeks.push({
        week: `Week ${i + 1}`,
        income: 0,
        expense: 0,
      });
    }

    monthlyTransactions.forEach((transaction) => {
      if (!transaction.date) {
        return;
      }

      const transactionDate = new Date(transaction.date);

      const day = transactionDate.getDate();

      const weekIndex = Math.floor((day - 1) / 7);

      if (!weeks[weekIndex]) {
        return;
      }

      const amount = Number(transaction.amount || 0);

      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      if (transaction.type === "income") {
        weeks[weekIndex].income += amount;
      } else {
        weeks[weekIndex].expense += amount;
      }
    });

    return weeks;
  }, [monthlyTransactions, selectedYear, selectedMonthNumber]);

  // ==================================================
  // Chart Display Data
  // ==================================================

  const chartDisplayData = useMemo(() => {
    return weeklyChartData.map((week) => ({
      ...week,

      incomeDisplay:
        week.income > 0 ? Math.log10(week.income + 1) : 0,

      expenseDisplay:
        week.expense > 0 ? Math.log10(week.expense + 1) : 0,
    }));
  }, [weeklyChartData]);

  // ==================================================
  // Display Latest Transactions
  // ==================================================

  const displayedTransactions = useMemo(() => {
    return monthlyTransactions
      .filter(
        (transaction) => transaction.type === transactionType,
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [monthlyTransactions, transactionType]);

  // ==================================================
  // Delete Transaction
  // ==================================================

  function handleDeleteTransaction(transaction) {
    setError("");

    setTransactionToDelete(transaction);

    setShowDeleteModal(true);
  }

  // ==================================================
  // Close Delete Modal
  // ==================================================

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);

    setTransactionToDelete(null);

    setError("");
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

      // Remove immediately from state
      setTransactions((previousTransactions) =>
        previousTransactions.filter(
          (transaction) =>
            transaction._id !== transactionToDelete._id,
        ),
      );

      // Refresh summary
      const token = localStorage.getItem("token");

      const summaryData = await getDashboardSummary(token);

      setSummary(summaryData.summary);

      // Close modal
      setShowDeleteModal(false);

      setTransactionToDelete(null);

      // Notify other components
      window.dispatchEvent(new Event("transactionsUpdated"));
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // ==================================================
  // Edit Transaction
  // ==================================================

  function handleEditTransaction(transactionId) {
    navigate(`/transactions?edit=${transactionId}`);
  }

  // ==================================================
  // LOADING SKELETON
  //
  // IMPORTANT:
  // The skeleton uses the SAME dashboard structure
  // as the real page.
  // ==================================================

  if (loading) {
    return (
      <div className="dashboard-new dashboard-skeleton-page">

        {/* ==========================================
            HEADER SKELETON
            ========================================== */}

        <div className="dashboard-top">

          <div className="dashboard-header-skeleton-content">

            <div className="skeleton-text dashboard-skeleton-label" />

            <div className="skeleton-text dashboard-skeleton-title" />

            <div className="skeleton-text dashboard-skeleton-description" />

          </div>

          <div className="dashboard-skeleton-add-button" />

        </div>

        {/* ==========================================
            SUMMARY SKELETON
            ========================================== */}

        <div className="dashboard-summary-grid">

          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="dashboard-summary-card dashboard-summary-skeleton"
            >
              <div className="dashboard-summary-skeleton-icon" />

              <div className="dashboard-summary-skeleton-content">

                <div className="skeleton-text dashboard-summary-skeleton-label" />

                <div className="skeleton-text dashboard-summary-skeleton-value" />

              </div>
            </div>
          ))}

        </div>

        {/* ==========================================
            STATISTICS SKELETON
            ========================================== */}

        <section className="statistics-card dashboard-statistics-skeleton">

          <div className="statistics-header">

            <div className="dashboard-statistics-heading-skeleton">

              <div className="skeleton-text dashboard-statistics-small-title" />

              <div className="skeleton-text dashboard-statistics-title" />

              <div className="skeleton-text dashboard-statistics-description" />

            </div>

            <div className="statistics-filters">

              <div className="dashboard-skeleton-selector" />

              <div className="dashboard-skeleton-selector" />

            </div>

          </div>

          {/* Same 300px chart area as actual dashboard */}

          <div className="dashboard-chart dashboard-chart-skeleton">

            <div className="dashboard-chart-skeleton-grid">

              <span />
              <span />
              <span />
              <span />
              <span />

            </div>

            <div className="dashboard-chart-skeleton-bars">

              <div className="dashboard-chart-skeleton-group">
                <div className="dashboard-chart-skeleton-bar bar-short" />
                <div className="dashboard-chart-skeleton-bar bar-medium" />
              </div>

              <div className="dashboard-chart-skeleton-group">
                <div className="dashboard-chart-skeleton-bar bar-tall" />
                <div className="dashboard-chart-skeleton-bar bar-short" />
              </div>

              <div className="dashboard-chart-skeleton-group">
                <div className="dashboard-chart-skeleton-bar bar-medium" />
                <div className="dashboard-chart-skeleton-bar bar-tall" />
              </div>

              <div className="dashboard-chart-skeleton-group">
                <div className="dashboard-chart-skeleton-bar bar-short" />
                <div className="dashboard-chart-skeleton-bar bar-medium" />
              </div>

              <div className="dashboard-chart-skeleton-group">
                <div className="dashboard-chart-skeleton-bar bar-tall" />
                <div className="dashboard-chart-skeleton-bar bar-medium" />
              </div>

            </div>

          </div>

          {/* Same legend position */}

          <div className="chart-legend">

            <div className="dashboard-skeleton-legend-item">
              <span className="dashboard-skeleton-legend-dot" />
              <span className="skeleton-text dashboard-skeleton-legend-text" />
            </div>

            <div className="dashboard-skeleton-legend-item">
              <span className="dashboard-skeleton-legend-dot" />
              <span className="skeleton-text dashboard-skeleton-legend-text" />
            </div>

          </div>

        </section>

        {/* ==========================================
            TRANSACTIONS SKELETON
            ========================================== */}

        <section className="dashboard-transactions-card dashboard-transactions-skeleton">

          <div className="transactions-header">

            <div className="dashboard-transactions-heading-skeleton">

              <div className="skeleton-text dashboard-statistics-small-title" />

              <div className="skeleton-text dashboard-transactions-title" />

              <div className="skeleton-text dashboard-transactions-description" />

            </div>

            <div className="skeleton-text dashboard-skeleton-view-all" />

          </div>

          {/* Same toggle size */}

          <div className="transaction-toggle dashboard-toggle-skeleton">

            <div className="dashboard-toggle-button-skeleton" />

            <div className="dashboard-toggle-button-skeleton" />

          </div>

          {/* Same transaction rows */}

          <div className="dashboard-transaction-list">

            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="dashboard-transaction-item dashboard-transaction-skeleton-item"
              >

                <div className="transaction-info">

                  <div className="transaction-icon dashboard-transaction-skeleton-icon" />

                  <div className="dashboard-transaction-skeleton-details">

                    <div className="skeleton-text dashboard-transaction-skeleton-title" />

                    <div className="skeleton-text dashboard-transaction-skeleton-meta" />

                  </div>

                </div>

                <div className="transaction-right">

                  <div className="skeleton-text dashboard-transaction-skeleton-amount" />

                  <div className="dashboard-transaction-skeleton-actions">

                    <div className="dashboard-transaction-skeleton-action" />

                    <div className="dashboard-transaction-skeleton-action" />

                  </div>

                </div>

              </div>
            ))}

          </div>

        </section>

      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error && !showDeleteModal) {
    return (
      <div className="dashboard-error">
        <div className="dashboard-error-card">

          <h2>Something went wrong</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="dashboard-new">

      {/* ==========================================
          HEADER
          ========================================== */}

      <div className="dashboard-top">

        <div>

          <span className="dashboard-label">
            FINANCIAL OVERVIEW
          </span>

          <h1>Dashboard</h1>

          <p>
            Here's what's happening with your money.
          </p>

        </div>

        <button
          type="button"
          className="dashboard-add-button"
          onClick={() => navigate("/transactions?add=true")}
        >
          <Plus size={18} />
          Add Transaction
        </button>

      </div>

      {/* ==========================================
          SUMMARY
          ========================================== */}

      <div className="dashboard-summary-grid">

        {/* Balance */}

        <div className="dashboard-summary-card balance-summary">

          <div className="summary-icon">
            <Wallet size={20} />
          </div>

          <div>

            <span>Total Balance</span>

            <h2>
              ₹
              {Number(
                summary?.balance || 0,
              ).toLocaleString("en-IN")}
            </h2>

          </div>

        </div>

        {/* Income */}

        <div className="dashboard-summary-card income-summary">

          <div className="summary-icon">
            <ArrowUpRight size={20} />
          </div>

          <div>

            <span>Total Income</span>

            <h2>
              ₹
              {Number(
                summary?.totalIncome || 0,
              ).toLocaleString("en-IN")}
            </h2>

          </div>

        </div>

        {/* Expenses */}

        <div className="dashboard-summary-card expense-summary">

          <div className="summary-icon">
            <ArrowDownRight size={20} />
          </div>

          <div>

            <span>Total Expenses</span>

            <h2>
              ₹
              {Number(
                summary?.totalExpense || 0,
              ).toLocaleString("en-IN")}
            </h2>

          </div>

        </div>

      </div>

      {/* ==========================================
          STATISTICS
          ========================================== */}

      <section className="statistics-card">

        <div className="statistics-header">

          <div>

            <span className="statistics-small-title">
              STATISTICS
            </span>

            <h2>
              {monthName} {selectedYear}
            </h2>

            <p>
              01 {monthName} -{" "}
              {new Date(
                selectedYear,
                selectedMonthNumber,
                0,
              ).getDate()}{" "}
              {monthName}
            </p>

          </div>

          <div className="statistics-filters">

            {/* Month */}

            <label className="month-selector">

              <select
                value={selectedMonthNumber}
                onChange={(event) => {
                  const month = String(
                    event.target.value,
                  ).padStart(2, "0");

                  setSelectedMonth(
                    `${selectedYear}-${month}`,
                  );
                }}
              >
                {[
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
                ].map((month, index) => (
                  <option
                    key={month}
                    value={index + 1}
                  >
                    {month}
                  </option>
                ))}
              </select>

              <ChevronDown size={16} />

            </label>

            {/* Year */}

            <label className="month-selector">

              <select
                value={selectedYear}
                onChange={(event) => {
                  const year = Number(
                    event.target.value,
                  );

                  setSelectedMonth(
                    `${year}-${String(
                      selectedMonthNumber,
                    ).padStart(2, "0")}`,
                  );
                }}
              >
                {availableYears.map((year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ))}
              </select>

              <ChevronDown size={16} />

            </label>

          </div>

        </div>

        {/* GRAPH */}

        <div className="dashboard-chart">

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={chartDisplayData}
              margin={{
                top: 15,
                right: 5,
                left: -15,
                bottom: 5,
              }}
              barGap={5}
            >

              <CartesianGrid
                strokeDasharray="4 5"
                vertical={false}
                stroke="#e9e5f5"
              />

              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "#8b8798",
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: "#8b8798",
                }}
                tickFormatter={(value) => {
                  if (value <= 0) {
                    return "₹0";
                  }

                  const original =
                    Math.pow(10, value) - 1;

                  if (original >= 1000000000) {
                    return `₹${(
                      original / 1000000000
                    ).toFixed(0)}B`;
                  }

                  if (original >= 1000000) {
                    return `₹${(
                      original / 1000000
                    ).toFixed(0)}M`;
                  }

                  if (original >= 1000) {
                    return `₹${(
                      original / 1000
                    ).toFixed(0)}k`;
                  }

                  return `₹${Math.round(original)}`;
                }}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(124, 58, 237, 0.04)",
                }}
                formatter={(
                  value,
                  name,
                  props,
                ) => {
                  const originalValue =
                    name === "Income"
                      ? props.payload.income
                      : props.payload.expense;

                  return [
                    `₹${Number(
                      originalValue,
                    ).toLocaleString("en-IN")}`,
                    name,
                  ];
                }}
                labelFormatter={(label) => label}
              />

              <Bar
                dataKey="incomeDisplay"
                name="Income"
                fill="#7c3aed"
                radius={[7, 7, 0, 0]}
                barSize={13}
              />

              <Bar
                dataKey="expenseDisplay"
                name="Expenses"
                fill="#f97316"
                radius={[7, 7, 0, 0]}
                barSize={13}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* LEGEND */}

        <div className="chart-legend">

          <div>
            <span className="legend-dot income-dot" />
            Income
          </div>

          <div>
            <span className="legend-dot expense-dot" />
            Expenses
          </div>

        </div>

      </section>

      {/* ==========================================
          TRANSACTIONS
          ========================================== */}

      <section className="dashboard-transactions-card">

        <div className="transactions-header">

          <div>

            <span className="statistics-small-title">
              ACTIVITY
            </span>

            <h2>Transactions</h2>

            <p>
              Your latest{" "}
              {transactionType === "income"
                ? "income"
                : "expenses"}
              .
            </p>

          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() => navigate("/transactions")}
          >
            View All
          </button>

        </div>

        {/* TOGGLE */}

        <div className="transaction-toggle">

          <button
            type="button"
            className={
              transactionType === "income"
                ? "active"
                : ""
            }
            onClick={() =>
              setTransactionType("income")
            }
          >
            Income
          </button>

          <button
            type="button"
            className={
              transactionType === "expense"
                ? "active"
                : ""
            }
            onClick={() =>
              setTransactionType("expense")
            }
          >
            Expenses
          </button>

        </div>

        {/* TRANSACTION LIST */}

        <div className="dashboard-transaction-list">

          {displayedTransactions.length === 0 ? (

            <div className="dashboard-empty">

              <p>
                No{" "}
                {transactionType === "income"
                  ? "income"
                  : "expenses"}{" "}
                found for {monthName}.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/transactions?add=true")
                }
              >
                Add Transaction
              </button>

            </div>

          ) : (

            displayedTransactions.map(
              (transaction) => {
                const transactionDate =
                  new Date(transaction.date);

                return (
                  <div
                    className="dashboard-transaction-item"
                    key={transaction._id}
                  >

                    <div className="transaction-info">

                      <div
                        className={
                          transaction.type ===
                          "income"
                            ? "transaction-icon income-transaction-icon"
                            : "transaction-icon expense-transaction-icon"
                        }
                      >
                        {transaction.type ===
                        "income" ? (
                          <ArrowUpRight
                            size={18}
                          />
                        ) : (
                          <ArrowDownRight
                            size={18}
                          />
                        )}
                      </div>

                      <div>

                        <h3>
                          {transaction.title}
                        </h3>

                        <p>
                          {transaction.category
                            ?.name ||
                            "Unknown category"}

                          {" · "}

                          {transaction.paymentMethod}

                          {" · "}

                          {transactionDate.toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="transaction-right">

                      <strong
                        className={
                          transaction.type ===
                          "income"
                            ? "income-amount"
                            : "expense-amount"
                        }
                      >
                        {transaction.type ===
                        "income"
                          ? "+"
                          : "-"}
                        ₹
                        {Number(
                          transaction.amount,
                        ).toLocaleString("en-IN")}
                      </strong>

                      <div className="transaction-actions">

                        <button
                          type="button"
                          title="Edit transaction"
                          onClick={() =>
                            handleEditTransaction(
                              transaction._id,
                            )
                          }
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title="Delete transaction"
                          onClick={() =>
                            handleDeleteTransaction(
                              transaction,
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </div>

                  </div>
                );
              },
            )

          )}

        </div>

        {/* REFRESH INDICATOR */}

        {refreshing && (
          <div className="dashboard-refreshing">
            Updating dashboard...
          </div>
        )}

      </section>

      {/* ==========================================
          DELETE MODAL
          ========================================== */}

      {showDeleteModal &&
        transactionToDelete && (
          <div className="delete-modal-overlay">

            <div className="delete-modal">

              <div className="delete-modal-icon">
                <Trash2 size={24} />
              </div>

              <h2>Delete Transaction?</h2>

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
                  onClick={closeDeleteModal}
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

export default Dashboard;