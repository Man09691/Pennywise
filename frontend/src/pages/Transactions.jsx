import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { apiRequest } from "../services/api";

import {
  Pencil,
  Trash2,
  CalendarDays,
  Plus,
  X,
  ChevronDown,
  Filter,
  Receipt,
  Wallet,
} from "lucide-react";

function Transactions() {
  // ==================================================
  // TRANSACTIONS
  // ==================================================

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==================================================
  // FORM
  // ==================================================

  const [showForm, setShowForm] =
    useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  // ==================================================
  // DELETE
  // ==================================================

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [transactionToDelete, setTransactionToDelete] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  // ==================================================
  // CATEGORIES
  // ==================================================

  const [categories, setCategories] =
    useState([]);

  // ==================================================
  // CURRENT DATE
  // ==================================================

  const now = new Date();

  // ==================================================
  // SEARCH PARAMS
  // ==================================================

  const [searchParams, setSearchParams] =
    useSearchParams();

  const navigate = useNavigate();

  const location = useLocation();

  // ==================================================
  // URL FILTER VALUES
  // ==================================================

  /*
   * Budget page sends:
   *
   * month
   * year
   * category
   * type
   *
   * Example:
   *
   * /transactions?
   * month=8
   * &year=2026
   * &category=123
   * &type=expense
   */

  const urlMonth =
    Number(searchParams.get("month"));

  const urlYear =
    Number(searchParams.get("year"));

  const urlCategory =
    searchParams.get("category") || "";

  const urlType =
    searchParams.get("type") || "";

  // ==================================================
  // TRANSACTION FILTERS
  // ==================================================

  const [selectedMonth, setSelectedMonth] =
    useState(
      urlMonth >= 1 && urlMonth <= 12
        ? urlMonth
        : now.getMonth() + 1,
    );

  const [selectedYear, setSelectedYear] =
    useState(
      urlYear >= now.getFullYear() - 5 &&
      urlYear <= now.getFullYear() + 5
        ? urlYear
        : now.getFullYear(),
    );

  const [selectedDate, setSelectedDate] =
    useState("");

  /*
   * NEW:
   *
   * Category filter.
   *
   * This gets populated automatically when
   * opening Transactions from Budget.
   */

  const [selectedCategory, setSelectedCategory] =
    useState(urlCategory);

  /*
   * NEW:
   *
   * Transaction type filter.
   *
   * Budget sends "expense".
   */

  const [selectedType, setSelectedType] =
    useState(urlType);

  // ==================================================
  // FORM DATA
  // ==================================================

  const [formData, setFormData] =
    useState({
      title: "",
      amount: "",
      type: "expense",
      category: "",
      paymentMethod: "",
      date: "",
      note: "",
    });

  // ==================================================
  // AVAILABLE YEARS
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
  // MONTH NAMES
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

  // ==================================================
  // SELECTED MONTH NAME
  // ==================================================

  const selectedMonthName =
    monthNames[selectedMonth - 1];

  // ==================================================
  // MONTH START / END
  // ==================================================

  const monthStartDate =
    `${selectedYear}-${String(
      selectedMonth,
    ).padStart(2, "0")}-01`;

  const monthEndDay =
    new Date(
      selectedYear,
      selectedMonth,
      0,
    ).getDate();

  const monthEndDate =
    `${selectedYear}-${String(
      selectedMonth,
    ).padStart(2, "0")}-${String(
      monthEndDay,
    ).padStart(2, "0")}`;

  // ==================================================
  // NOTIFY DASHBOARD
  // ==================================================

  function notifyTransactionsUpdated() {
    window.dispatchEvent(
      new Event("transactionsUpdated"),
    );
  }

  // ==================================================
  // LOAD TRANSACTIONS
  // ==================================================

  async function loadTransactions(
    showLoading = true,
  ) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const data =
        await apiRequest(
          "/transactions",
          {
            cache: "no-store",
          },
        );

      setTransactions(
        data.transactions || [],
      );
    } catch (error) {
      setError(error.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  // ==================================================
  // LOAD CATEGORIES
  // ==================================================

  async function loadCategories() {
    try {
      const data =
        await apiRequest(
          "/categories",
          {
            cache: "no-store",
          },
        );

      setCategories(
        data.categories || [],
      );
    } catch (error) {
      setError(error.message);
    }
  }

  // ==================================================
  // INITIAL LOAD
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
  // APPLY URL FILTERS
  // ==================================================

  /*
   * This effect makes sure that whenever we
   * navigate from Budget -> Transactions,
   * the correct filters are applied.
   */

  useEffect(() => {
    const monthFromUrl =
      Number(
        searchParams.get("month"),
      );

    const yearFromUrl =
      Number(
        searchParams.get("year"),
      );

    const categoryFromUrl =
      searchParams.get(
        "category",
      ) || "";

    const typeFromUrl =
      searchParams.get("type") ||
      "";

    if (
      monthFromUrl >= 1 &&
      monthFromUrl <= 12
    ) {
      setSelectedMonth(
        monthFromUrl,
      );
    }

    if (
      yearFromUrl >=
        now.getFullYear() - 5 &&
      yearFromUrl <=
        now.getFullYear() + 5
    ) {
      setSelectedYear(
        yearFromUrl,
      );
    }

    setSelectedCategory(
      categoryFromUrl,
    );

    setSelectedType(
      typeFromUrl,
    );

    /*
     * When category/month/year comes
     * from Budget, clear specific date.
     */

    if (
      monthFromUrl ||
      yearFromUrl ||
      categoryFromUrl
    ) {
      setSelectedDate("");
    }
  }, [searchParams]);

  // ==================================================
  // RESTORE FORM FROM CATEGORIES
  // ==================================================

  useEffect(() => {
    const restoredFormData =
      location.state
        ?.transactionFormData;

    if (!restoredFormData) {
      return;
    }

    setEditingTransaction(
      null,
    );

    setFormData({
      title:
        restoredFormData.title ||
        "",
      amount:
        restoredFormData.amount ||
        "",
      type:
        restoredFormData.type ||
        "expense",
      category:
        restoredFormData.category ||
        "",
      paymentMethod:
        restoredFormData.paymentMethod ||
        "",
      date:
        restoredFormData.date ||
        "",
      note:
        restoredFormData.note ||
        "",
    });

    setError("");
    setShowForm(true);

    navigate(
      "/transactions",
      {
        replace: true,
        state: null,
      },
    );
  }, [
    location.state,
    navigate,
  ]);

  // ==================================================
  // FILTER TRANSACTIONS
  // ==================================================

  const filteredTransactions =
    transactions.filter(
      (transaction) => {

        // --------------------------------------------
        // DATE CHECK
        // --------------------------------------------

        if (!transaction.date) {
          return false;
        }

        const transactionDate =
          new Date(
            transaction.date,
          );

        if (
          Number.isNaN(
            transactionDate.getTime(),
          )
        ) {
          return false;
        }

        // --------------------------------------------
        // MONTH
        // --------------------------------------------

        if (
          transactionDate.getMonth() +
            1 !==
          selectedMonth
        ) {
          return false;
        }

        // --------------------------------------------
        // YEAR
        // --------------------------------------------

        if (
          transactionDate.getFullYear() !==
          selectedYear
        ) {
          return false;
        }

        // --------------------------------------------
        // TYPE
        // --------------------------------------------

        if (
          selectedType &&
          transaction.type !==
            selectedType
        ) {
          return false;
        }

        // --------------------------------------------
        // CATEGORY
        // --------------------------------------------

        if (
          selectedCategory
        ) {
          const transactionCategoryId =
            transaction.category?._id ||
            transaction.category;

          if (
            transactionCategoryId !==
            selectedCategory
          ) {
            return false;
          }
        }

        // --------------------------------------------
        // SPECIFIC DATE
        // --------------------------------------------

        if (!selectedDate) {
          return true;
        }

        const selectedDateObject =
          new Date(
            selectedDate +
              "T00:00:00",
          );

        if (
          Number.isNaN(
            selectedDateObject.getTime(),
          )
        ) {
          return false;
        }

        return (
          transactionDate.getFullYear() ===
            selectedDateObject.getFullYear() &&
          transactionDate.getMonth() ===
            selectedDateObject.getMonth() &&
          transactionDate.getDate() ===
            selectedDateObject.getDate()
        );
      },
    );

  // ==================================================
  // SORT
  // ==================================================

  const sortedTransactions =
    [...filteredTransactions].sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date),
    );

  // ==================================================
  // HANDLE INPUT CHANGE
  // ==================================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      }),
    );
  }

  // ==================================================
  // RESET FORM
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

    setEditingTransaction(
      null,
    );
  }

  // ==================================================
  // ADD TRANSACTION
  // ==================================================

  function handleAddTransaction() {
    resetForm();

    setError("");
    setShowForm(true);
  }

  // ==================================================
  // EDIT TRANSACTION
  // ==================================================

  function handleEditTransaction(
    transaction,
  ) {
    setError("");

    setEditingTransaction(
      transaction,
    );

    setFormData({
      title:
        transaction.title ||
        "",
      amount:
        transaction.amount ??
        "",
      type:
        transaction.type ||
        "expense",
      category:
        transaction.category?._id ||
        transaction.category ||
        "",
      paymentMethod:
        transaction.paymentMethod ||
        "",
      date:
        transaction.date
          ? new Date(
              transaction.date,
            )
              .toISOString()
              .split("T")[0]
          : "",
      note:
        transaction.note ||
        "",
    });

    setShowForm(true);
  }

  // ==================================================
  // AUTOMATIC EDIT FROM DASHBOARD
  // ==================================================

  useEffect(() => {
    const editId =
      searchParams.get(
        "edit",
      );

    if (
      !editId ||
      transactions.length === 0
    ) {
      return;
    }

    const transaction =
      transactions.find(
        (item) =>
          item._id === editId,
      );

    if (transaction) {
      handleEditTransaction(
        transaction,
      );

      setSearchParams({});
    }
  }, [
    transactions,
    searchParams,
    setSearchParams,
  ]);

  // ==================================================
  // AUTOMATIC ADD FROM DASHBOARD
  // ==================================================

  useEffect(() => {
    const addTransaction =
      searchParams.get(
        "add",
      );

    if (
      addTransaction !== "true"
    ) {
      return;
    }

    setEditingTransaction(
      null,
    );

    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "",
      paymentMethod: "",
      date: "",
      note: "",
    });

    setError("");
    setShowForm(true);

    setSearchParams({});
  }, [
    searchParams,
    setSearchParams,
  ]);

  // ==================================================
  // DELETE TRANSACTION
  // ==================================================

  function handleDeleteTransaction(
    transaction,
  ) {
    setError("");

    setTransactionToDelete(
      transaction,
    );

    setShowDeleteModal(true);
  }

  // ==================================================
  // CONFIRM DELETE
  // ==================================================

  async function confirmDeleteTransaction() {
    if (
      !transactionToDelete ||
      deleting
    ) {
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

      await loadTransactions(
        false,
      );

      setShowDeleteModal(
        false,
      );

      setTransactionToDelete(
        null,
      );

      notifyTransactionsUpdated();
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // ==================================================
  // ADD CATEGORY
  // ==================================================

  function handleAddCategory() {
    navigate(
      "/categories",
      {
        state: {
          from: "transaction",
          transactionFormData:
            formData,
        },
      },
    );
  }

  // ==================================================
  // SUBMIT TRANSACTION
  // ==================================================

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    if (
      !formData.title.trim() ||
      !formData.amount ||
      !formData.category ||
      !formData.paymentMethod
    ) {
      setError(
        "Please fill in all required fields.",
      );

      return;
    }

    const amount =
      Number(
        formData.amount,
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid amount.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const transactionData = {
        title:
          formData.title.trim(),

        amount,

        type:
          formData.type,

        category:
          formData.category,

        paymentMethod:
          formData.paymentMethod,

        ...(formData.date
          ? {
              date:
                formData.date,
            }
          : {}),

        ...(formData.note.trim()
          ? {
              note:
                formData.note.trim(),
            }
          : {}),
      };

      if (
        editingTransaction
      ) {
        await apiRequest(
          `/transactions/${editingTransaction._id}`,
          {
            method: "PUT",
            body: JSON.stringify(
              transactionData,
            ),
          },
        );
      } else {
        await apiRequest(
          "/transactions",
          {
            method: "POST",
            body: JSON.stringify(
              transactionData,
            ),
          },
        );
      }

      await loadTransactions(
        false,
      );

      setShowForm(false);

      resetForm();

      /*
       * IMPORTANT:
       *
       * Don't destroy the Budget filters
       * if user came from Budget.
       */

      notifyTransactionsUpdated();
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ==================================================
  // FILTER CATEGORIES BY TYPE
  // ==================================================

  const filteredCategories =
    categories.filter(
      (category) =>
        category.type ===
        formData.type,
    );

  // ==================================================
  // SELECTED CATEGORY NAME
  // ==================================================

  const selectedCategoryObject =
    categories.find(
      (category) =>
        category._id ===
        selectedCategory,
    );

  const selectedCategoryName =
    selectedCategoryObject?.name;

  // ==================================================
  // CLOSE FORM
  // ==================================================

  function closeForm() {
    if (submitting) {
      return;
    }

    setShowForm(false);

    resetForm();

    setError("");

    /*
     * Preserve URL filters if we came from
     * Budget.
     *
     * Only remove "add" and "edit".
     */

    const preservedParams =
      new URLSearchParams(
        searchParams,
      );

    preservedParams.delete(
      "add",
    );

    preservedParams.delete(
      "edit",
    );

    setSearchParams(
      preservedParams,
    );
  }

  // ==================================================
  // CLEAR DATE
  // ==================================================

  function clearDateFilter() {
    setSelectedDate("");
  }

  // ==================================================
  // CLEAR CATEGORY FILTER
  // ==================================================

  function clearCategoryFilter() {
    setSelectedCategory("");

    const params =
      new URLSearchParams(
        searchParams,
      );

    params.delete(
      "category",
    );

    setSearchParams(params);
  }

  // ==================================================
  // FORMAT SELECTED DATE
  // ==================================================

  function getFormattedSelectedDate() {
    if (!selectedDate) {
      return `${selectedMonthName} ${selectedYear}`;
    }

    const date =
      new Date(
        selectedDate +
          "T00:00:00",
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return `${selectedMonthName} ${selectedYear}`;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="transactions-page">

        <div className="transactions-header-skeleton">

          <div className="skeleton-text skeleton-title" />

          <div className="skeleton-button" />

        </div>

        <div className="transaction-filter-card skeleton-filter">

          <div className="skeleton-text skeleton-subtitle" />

          <div className="skeleton-filters">

            <div className="skeleton-select" />

            <div className="skeleton-select" />

            <div className="skeleton-select" />

          </div>

        </div>

        <div className="transactions-list-card skeleton-list">

          {Array.from({
            length: 5,
          }).map(
            (_, i) => (
              <div
                key={i}
                className="skeleton-transaction-item"
              >

                <div className="skeleton-icon" />

                <div className="skeleton-details">

                  <div className="skeleton-text skeleton-line-short" />

                  <div className="skeleton-text skeleton-line-long" />

                </div>

                <div className="skeleton-amount" />

              </div>
            ),
          )}

        </div>

      </div>
    );
  }

  // ==================================================
  // ERROR STATE
  // ==================================================

  if (
    error &&
    !showForm &&
    !showDeleteModal
  ) {
    return (
      <div className="transactions-page">

        <div className="transactions-error-state">

          <div className="error-icon-wrapper">
            <Receipt size={40} />
          </div>

          <h2>
            Something went wrong
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              loadTransactions(true)
            }
            className="retry-button"
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
    <div className="transactions-page">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="transactions-header">

        <div className="transactions-header-left">

          <span className="transactions-label">
            MONEY ACTIVITY
          </span>

          <h1>
            Transactions
          </h1>

          <p>
            Manage and review your
            income and expenses.
          </p>

        </div>

        <button
          type="button"
          className="add-transaction-button"
          onClick={
            handleAddTransaction
          }
        >
          <Plus size={18} />
          Add Transaction
        </button>

      </div>

      {/* ==================================================
          FILTER CARD
          ================================================== */}

      <section className="transaction-filter-card">

        <div className="transaction-filter-heading">

          <div>

            <h2>
              Transaction History
            </h2>

            <p>
              Choose a month and
              year. Select a date
              only if you want to
              see one specific day.
            </p>

          </div>

          <div className="transaction-count">

            <span className="count-number">
              {
                sortedTransactions.length
              }
            </span>

            <span className="count-label">
              {
                sortedTransactions.length ===
                1
                  ? "transaction"
                  : "transactions"
              }
            </span>

          </div>

        </div>

        <div className="transaction-filters">

          {/* MONTH */}

          <div className="filter-group">

            <label>
              Month
            </label>

            <div className="custom-select-wrapper">

              <select
                value={
                  selectedMonth
                }
                onChange={(
                  event,
                ) => {

                  setSelectedMonth(
                    Number(
                      event.target
                        .value,
                    ),
                  );

                  setSelectedDate(
                    "",
                  );
                }}
              >

                {monthNames.map(
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

              <ChevronDown
                size={16}
                className="select-chevron"
              />

            </div>

          </div>

          {/* YEAR */}

          <div className="filter-group">

            <label>
              Year
            </label>

            <div className="custom-select-wrapper">

              <select
                value={
                  selectedYear
                }
                onChange={(
                  event,
                ) => {

                  setSelectedYear(
                    Number(
                      event.target
                        .value,
                    ),
                  );

                  setSelectedDate(
                    "",
                  );
                }}
              >

                {availableYears.map(
                  (yearValue) => (
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

              <ChevronDown
                size={16}
                className="select-chevron"
              />

            </div>

          </div>

          {/* CATEGORY */}

          <div className="filter-group">

            <label>
              Category
            </label>

            <div className="custom-select-wrapper">

              <select
                value={
                  selectedCategory
                }
                onChange={(
                  event,
                ) => {

                  setSelectedCategory(
                    event.target
                      .value,
                  );
                }}
              >

                <option value="">
                  All Categories
                </option>

                {categories
                  .filter(
                    (
                      category,
                    ) =>
                      category.type ===
                      "expense",
                  )
                  .map(
                    (
                      category,
                    ) => (
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

              <ChevronDown
                size={16}
                className="select-chevron"
              />

            </div>

          </div>

          {/* DATE */}

          <div className="filter-group date-filter-group">

            <label>
              Specific Date{" "}
              <span className="optional-badge">
                Optional
              </span>
            </label>

            <div className="date-input-wrapper">

              <CalendarDays
                size={17}
              />

              <input
                type="date"
                value={
                  selectedDate
                }
                min={
                  monthStartDate
                }
                max={
                  monthEndDate
                }
                onChange={(
                  event,
                ) =>
                  setSelectedDate(
                    event.target
                      .value,
                  )
                }
              />

            </div>

          </div>

          {/* CLEAR DATE */}

          {selectedDate && (
            <button
              type="button"
              className="clear-date-button"
              onClick={
                clearDateFilter
              }
            >
              <X size={14} />
              Clear Date
            </button>
          )}

        </div>

        {/* ACTIVE FILTER */}

        <div className="active-filter">

          <Filter size={14} />

          <span>
            Showing:
          </span>

          <strong>
            {
              getFormattedSelectedDate()
            }
          </strong>

          {selectedCategoryName && (
            <>
              <span>
                ·
              </span>

              <strong>
                {
                  selectedCategoryName
                }
              </strong>
            </>
          )}

          {selectedType && (
            <>
              <span>
                ·
              </span>

              <strong>
                {selectedType ===
                "expense"
                  ? "Expenses"
                  : "Income"}
              </strong>
            </>
          )}

        </div>

      </section>

      {/* ==================================================
          TRANSACTION LIST
          ================================================== */}

      <section className="transactions-list-card">

        {sortedTransactions.length ===
        0 ? (

          <div className="transactions-empty">

            <div className="transactions-empty-icon">
              <CalendarDays
                size={32}
              />
            </div>

            <h2>
              No transactions found
            </h2>

            <p>
              There are no
              transactions for{" "}
              <strong>
                {
                  getFormattedSelectedDate()
                }
              </strong>

              {selectedCategoryName && (
                <>
                  {" "}
                  in{" "}
                  <strong>
                    {
                      selectedCategoryName
                    }
                  </strong>
                </>
              )}
              .
            </p>

            <button
              type="button"
              onClick={
                handleAddTransaction
              }
              className="empty-add-button"
            >
              <Plus size={16} />
              Add Transaction
            </button>

          </div>

        ) : (

          <div className="transactions-list">

            {sortedTransactions.map(
              (
                transaction,
                index,
              ) => {

                const transactionDate =
                  new Date(
                    transaction.date,
                  );

                const formattedDate =
                  transactionDate.toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  );

                return (
                  <div
                    className="transaction-item"
                    key={
                      transaction._id
                    }
                    style={{
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >

                    {/* LEFT */}

                    <div className="transaction-main">

                      <div
                        className={
                          transaction.type ===
                          "income"
                            ? "transaction-type-icon income-icon"
                            : "transaction-type-icon expense-icon"
                        }
                      >

                        {transaction.type ===
                        "income" ? (
                          <Wallet
                            size={18}
                          />
                        ) : (
                          <Receipt
                            size={18}
                          />
                        )}

                      </div>

                      <div className="transaction-details">

                        <h3>
                          {
                            transaction.title
                          }
                        </h3>

                        <p>

                          {
                            transaction
                              .category
                              ?.name ||
                            "Unknown category"
                          }

                          <span className="dot-separator">
                            ·
                          </span>

                          {
                            transaction.paymentMethod
                          }

                        </p>

                        <span className="transaction-date">

                          <CalendarDays
                            size={13}
                          />

                          {
                            formattedDate
                          }

                        </span>

                      </div>

                    </div>

                    {/* RIGHT */}

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
                        ).toLocaleString(
                          "en-IN",
                        )}

                      </strong>

                      <div className="transaction-actions">

                        <button
                          type="button"
                          title="Edit transaction"
                          onClick={() =>
                            handleEditTransaction(
                              transaction,
                            )
                          }
                          className="action-btn edit-btn"
                        >
                          <Pencil
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          title="Delete transaction"
                          onClick={() =>
                            handleDeleteTransaction(
                              transaction,
                            )
                          }
                          className="action-btn delete-btn"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>

                      </div>

                    </div>

                  </div>
                );
              },
            )}

          </div>
        )}

      </section>

      {/* ==================================================
          ADD / EDIT TRANSACTION FORM
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
              onClick={
                closeForm
              }
              disabled={
                submitting
              }
            >
              <X size={20} />
            </button>

            {/* HEADER */}

            <div className="transaction-form-header">

              <span className="form-label">
                {editingTransaction
                  ? "UPDATE TRANSACTION"
                  : "NEW TRANSACTION"}
              </span>

              <h2>
                {editingTransaction
                  ? "Edit Transaction"
                  : "Add Transaction"}
              </h2>

              <p>
                {editingTransaction
                  ? "Update the details of your transaction."
                  : "Record your income or expense."}
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

              {/* TITLE */}

              <div className="form-group">

                <label>
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={
                    formData.title
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Grocery shopping"
                  className="form-input"
                />

              </div>

              {/* AMOUNT */}

              <div className="form-group">

                <label>
                  Amount
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
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    className="form-input amount-input"
                  />

                </div>

              </div>

              {/* TYPE */}

              <div className="form-group">

                <label>
                  Type
                </label>

                <div className="type-toggle">

                  <button
                    type="button"
                    className={
                      formData.type ===
                      "expense"
                        ? "active"
                        : ""
                    }
                    onClick={() => {

                      setFormData(
                        (
                          previousData,
                        ) => ({
                          ...previousData,
                          type: "expense",
                          category: "",
                        }),
                      );

                    }}
                  >
                    Expense
                  </button>

                  <button
                    type="button"
                    className={
                      formData.type ===
                      "income"
                        ? "active"
                        : ""
                    }
                    onClick={() => {

                      setFormData(
                        (
                          previousData,
                        ) => ({
                          ...previousData,
                          type: "income",
                          category: "",
                        }),
                      );

                    }}
                  >
                    Income
                  </button>

                </div>

              </div>

              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category
                </label>

                <div className="custom-select-wrapper">

                  <select
                    name="category"
                    value={
                      formData.category
                    }
                    onChange={(
                      event,
                    ) => {

                      const value =
                        event.target
                          .value;

                      if (
                        value ===
                        "other"
                      ) {
                        handleAddCategory();
                        return;
                      }

                      setFormData(
                        (
                          previousData,
                        ) => ({
                          ...previousData,
                          category:
                            value,
                        }),
                      );

                    }}
                  >

                    <option value="">
                      Select category
                    </option>

                    {filteredCategories.map(
                      (
                        category,
                      ) => (
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

                    <option value="other">
                      + Add new category
                    </option>

                  </select>

                  <ChevronDown
                    size={16}
                    className="select-chevron"
                  />

                </div>

              </div>

              {/* PAYMENT METHOD */}

              <div className="form-group">

                <label>
                  Payment Method
                </label>

                <div className="custom-select-wrapper">

                  <select
                    name="paymentMethod"
                    value={
                      formData.paymentMethod
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select payment method
                    </option>

                    <option value="Cash">
                      Cash
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

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                  </select>

                  <ChevronDown
                    size={16}
                    className="select-chevron"
                  />

                </div>

              </div>

              {/* DATE */}

              <div className="form-group">

                <label>
                  Transaction Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={
                    formData.date
                  }
                  onChange={
                    handleChange
                  }
                  className="form-input"
                />

                <small>
                  Leave empty to use
                  today's date.
                </small>

              </div>

              {/* NOTE */}

              <div className="form-group">

                <label>
                  Note{" "}
                  <span className="optional-text">
                    (Optional)
                  </span>
                </label>

                <textarea
                  name="note"
                  value={
                    formData.note
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Add a note about this transaction..."
                  rows="3"
                  className="form-textarea"
                />

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
                    submitting
                  }
                  className="btn-primary"
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
                Are you sure you want
                to delete{" "}
                <strong>
                  &quot;
                  {
                    transactionToDelete.title
                  }
                  &quot;
                </strong>
                ?
              </p>

              <p className="delete-modal-warning">
                This transaction will
                be removed from your
                transaction list.
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

                    setShowDeleteModal(
                      false,
                    );

                    setTransactionToDelete(
                      null,
                    );

                    setError("");

                  }}
                  disabled={
                    deleting
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="delete-confirm-button"
                  onClick={
                    confirmDeleteTransaction
                  }
                  disabled={
                    deleting
                  }
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