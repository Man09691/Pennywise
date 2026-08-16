import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { Pencil, Trash2, CalendarDays } from "lucide-react";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================================================
  // FORM STATE
  // ==================================================

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ==================================================
  // DELETE STATE
  // ==================================================

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [transactionToDelete, setTransactionToDelete] =
    useState(null);

  const [deleting, setDeleting] = useState(false);

  // ==================================================
  // CATEGORY STATE
  // ==================================================

  const [categories, setCategories] = useState([]);

  const [showCategoryForm, setShowCategoryForm] =
    useState(false);

  const [newCategoryName, setNewCategoryName] =
    useState("");

  // ==================================================
  // TRANSACTION FILTERS
  // ==================================================

  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    now.getMonth() + 1,
  );

  const [selectedYear, setSelectedYear] = useState(
    now.getFullYear(),
  );

  // Optional specific date
  const [selectedDate, setSelectedDate] = useState("");

  // ==================================================
  // SEARCH PARAMS
  // ==================================================

  const [searchParams, setSearchParams] =
    useSearchParams();

  // ==================================================
  // FORM DATA
  // ==================================================

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
  // MONTH START / END DATE
  // ==================================================

  const monthStartDate = `${selectedYear}-${String(
    selectedMonth,
  ).padStart(2, "0")}-01`;

  const monthEndDay = new Date(
    selectedYear,
    selectedMonth,
    0,
  ).getDate();

  const monthEndDate = `${selectedYear}-${String(
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

      const data = await apiRequest(
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
      const data = await apiRequest(
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
  // FILTER TRANSACTIONS
  //
  // 1. Month
  // 2. Year
  // 3. Optional Date
  // ==================================================

  const filteredTransactions =
    transactions.filter((transaction) => {
      if (!transaction.date) {
        return false;
      }

      const transactionDate =
        new Date(transaction.date);

      if (
        Number.isNaN(
          transactionDate.getTime(),
        )
      ) {
        return false;
      }

      // ----------------------------------------------
      // MATCH MONTH
      // ----------------------------------------------

      if (
        transactionDate.getMonth() + 1 !==
        selectedMonth
      ) {
        return false;
      }

      // ----------------------------------------------
      // MATCH YEAR
      // ----------------------------------------------

      if (
        transactionDate.getFullYear() !==
        selectedYear
      ) {
        return false;
      }

      // ----------------------------------------------
      // NO DATE SELECTED
      //
      // Show all transactions for selected
      // month and year.
      // ----------------------------------------------

      if (!selectedDate) {
        return true;
      }

      // ----------------------------------------------
      // SPECIFIC DATE SELECTED
      //
      // Show only transactions from that date.
      // ----------------------------------------------

      const selectedDateObject =
        new Date(
          `${selectedDate}T00:00:00`,
        );

      return (
        transactionDate.getFullYear() ===
          selectedDateObject.getFullYear() &&
        transactionDate.getMonth() ===
          selectedDateObject.getMonth() &&
        transactionDate.getDate() ===
          selectedDateObject.getDate()
      );
    });

  // ==================================================
  // SORT TRANSACTIONS
  //
  // Latest transaction first
  // ==================================================

  const sortedTransactions = [
    ...filteredTransactions,
  ].sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date),
  );

  // ==================================================
  // HANDLE INPUT CHANGE
  // ==================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
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

    setEditingTransaction(null);
    setShowCategoryForm(false);
    setNewCategoryName("");
  }

  // ==================================================
  // OPEN ADD TRANSACTION
  // ==================================================

  function handleAddTransaction() {
    resetForm();

    setError("");

    setShowForm(true);
  }

  // ==================================================
  // OPEN EDIT TRANSACTION
  // ==================================================

  function handleEditTransaction(
    transaction,
  ) {
    setError("");

    setEditingTransaction(
      transaction,
    );

    setFormData({
      title: transaction.title || "",

      amount:
        transaction.amount ?? "",

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

      date: transaction.date
        ? new Date(transaction.date)
            .toISOString()
            .split("T")[0]
        : "",

      note:
        transaction.note || "",
    });

    setShowCategoryForm(false);

    setNewCategoryName("");

    setShowForm(true);
  }

  // ==================================================
  // AUTOMATICALLY OPEN EDIT
  // FROM DASHBOARD
  // ==================================================

  useEffect(() => {
    const editId =
      searchParams.get("edit");

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

      await loadTransactions(false);

      setShowDeleteModal(false);

      setTransactionToDelete(null);

      notifyTransactionsUpdated();
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // ==================================================
  // ADD NEW CATEGORY
  // ==================================================

  async function handleAddCategory() {
    setError("");

    const categoryName =
      newCategoryName.trim();

    if (!categoryName) {
      setError(
        "Category name is required.",
      );

      return;
    }

    try {
      const data =
        await apiRequest(
          "/categories",
          {
            method: "POST",

            body: JSON.stringify({
              name: categoryName,
              type: formData.type,
            }),
          },
        );

      await loadCategories();

      setFormData(
        (previousData) => ({
          ...previousData,
          category:
            data.category._id,
        }),
      );

      setShowCategoryForm(false);

      setNewCategoryName("");
    } catch (error) {
      setError(error.message);
    }
  }

  // ==================================================
  // SUBMIT TRANSACTION
  // ==================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

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
      Number(formData.amount);

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

        type: formData.type,

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

      // ----------------------------------------------
      // EDIT
      // ----------------------------------------------

      if (editingTransaction) {
        await apiRequest(
          `/transactions/${editingTransaction._id}`,
          {
            method: "PUT",

            body: JSON.stringify(
              transactionData,
            ),
          },
        );
      }

      // ----------------------------------------------
      // ADD
      // ----------------------------------------------

      else {
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

      // ----------------------------------------------
      // REFRESH
      // ----------------------------------------------

      await loadTransactions(false);

      // ----------------------------------------------
      // CLOSE FORM
      // ----------------------------------------------

      setShowForm(false);

      resetForm();

      setSearchParams({});

      // ----------------------------------------------
      // NOTIFY DASHBOARD
      // ----------------------------------------------

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
  // CLOSE FORM
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
  // CLEAR DATE FILTER
  // ==================================================

  function clearDateFilter() {
    setSelectedDate("");
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="transactions-loading">
        <div className="transactions-loading-card">
          Loading transactions...
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (
    error &&
    !showForm &&
    !showDeleteModal
  ) {
    return (
      <div className="transactions-error">
        <h2>
          Something went wrong
        </h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={() =>
            loadTransactions(true)
          }
        >
          Try Again
        </button>
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

        <div>
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
          + Add Transaction
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
              Choose a month and year.
              Select a date only if you
              want to see one specific day.
            </p>
          </div>

          <div className="transaction-count">

            {sortedTransactions.length}

            {" "}

            {sortedTransactions.length ===
            1
              ? "transaction"
              : "transactions"}

          </div>

        </div>

        <div className="transaction-filters">

          {/* MONTH */}

          <div className="filter-group">

            <label>
              Month
            </label>

            <select
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(
                  Number(
                    event.target.value,
                  ),
                );

                // Clear date because
                // old date may belong
                // to previous month.
                setSelectedDate("");
              }}
            >
              {monthNames.map(
                (month, index) => (
                  <option
                    key={month}
                    value={index + 1}
                  >
                    {month}
                  </option>
                ),
              )}
            </select>

          </div>

          {/* YEAR */}

          <div className="filter-group">

            <label>
              Year
            </label>

            <select
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(
                  Number(
                    event.target.value,
                  ),
                );

                // Clear date when
                // changing year.
                setSelectedDate("");
              }}
            >
              {availableYears.map(
                (year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ),
              )}
            </select>

          </div>

          {/* DATE */}

          <div className="filter-group date-filter-group">

            <label>
              Specific Date
              <span>
                {" "}
                (Optional)
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
              Clear Date
            </button>
          )}

        </div>

        {/* CURRENT FILTER */}

        <div className="active-filter">

          <span>
            Showing:
          </span>

          <strong>
            {selectedDate
              ? new Date(
                  `${selectedDate}T00:00:00`,
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  },
                )
              : `${selectedMonthName} ${selectedYear}`}
          </strong>

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
                size={28}
              />
            </div>

            <h2>
              No transactions found
            </h2>

            <p>
              There are no transactions
              for{" "}

              <strong>
                {selectedDate
                  ? new Date(
                      `${selectedDate}T00:00:00`,
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      },
                    )
                  : `${selectedMonthName} ${selectedYear}`}
              </strong>
              .
            </p>

            <button
              type="button"
              onClick={
                handleAddTransaction
              }
            >
              + Add Transaction
            </button>

          </div>

        ) : (

          <div className="transactions-list">

            {sortedTransactions.map(
              (transaction) => {

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
                        "income"
                          ? "+"
                          : "-"}
                      </div>

                      <div className="transaction-details">

                        <h3>
                          {
                            transaction.title
                          }
                        </h3>

                        <p>

                          {transaction.category
                            ?.name ||
                            "Unknown category"}

                          {" · "}

                          {
                            transaction.paymentMethod
                          }

                        </p>

                        {/* DATE */}

                        <span className="transaction-date">

                          <CalendarDays
                            size={14}
                          />

                          {formattedDate}

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
                        >
                          <Pencil
                            size={17}
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
                        >
                          <Trash2
                            size={17}
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
          ADD / EDIT FORM
          ================================================== */}

      {showForm && (

        <div className="transaction-form">

          <div className="transaction-form-card">

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
              ×
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
                />

              </div>

              {/* AMOUNT */}

              <div className="form-group">

                <label>
                  Amount
                </label>

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
                />

              </div>

              {/* TYPE */}

              <div className="form-group">

                <label>
                  Type
                </label>

                <select
                  name="type"
                  value={
                    formData.type
                  }
                  onChange={(
                    event,
                  ) => {

                    setFormData(
                      (
                        previousData,
                      ) => ({
                        ...previousData,

                        type:
                          event
                            .target
                            .value,

                        category:
                          "",
                      }),
                    );

                    setShowCategoryForm(
                      false,
                    );

                    setNewCategoryName(
                      "",
                    );

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

                      setShowCategoryForm(
                        true,
                      );

                      setFormData(
                        (
                          previousData,
                        ) => ({
                          ...previousData,
                          category:
                            "",
                        }),
                      );

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

                    setShowCategoryForm(
                      false,
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
                    Other → Add new category
                  </option>

                </select>

                {/* ADD CATEGORY */}

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
                      onChange={(
                        event,
                      ) =>
                        setNewCategoryName(
                          event.target
                            .value,
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

                          setNewCategoryName(
                            "",
                          );

                          setError(
                            "",
                          );

                        }}
                      >
                        Cancel
                      </button>

                    </div>

                  </div>
                )}

              </div>

              {/* PAYMENT METHOD */}

              <div className="form-group">

                <label>
                  Payment Method
                </label>

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
                />

                <small>
                  Leave empty to use
                  today's date.
                </small>

              </div>

              {/* NOTE */}

              <div className="form-group">

                <label>
                  Note
                  <span>
                    {" "}
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
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
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

                <Trash2
                  size={24}
                />

              </div>

              <h2>
                Delete Transaction?
              </h2>

              <p>

                Are you sure you want
                to delete{" "}

                <strong>
                  "{transactionToDelete.title}"
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