import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import { Pencil, Trash2, Plus } from "lucide-react";

function Categories() {
  const [categories, setCategories] = useState([]);
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
  // LOAD CATEGORIES
  // ==================================================

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/categories");

      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadCategories();
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
  //
  // This is used by the normal Categories page.
  //
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
  // LOADING
  // ==================================================

  if (loading) {
    return <h1>Loading categories...</h1>;
  }

  // ==================================================
  // PAGE ERROR
  // ==================================================

  if (error && !showForm && !showDeleteModal) {
    return <h1>Error: {error}</h1>;
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
          <h1>Categories</h1>

          <p>
            Manage your expense and income categories.
          </p>
        </div>

        <button
          type="button"
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
        <p className="form-error">
          {error}
        </p>
      )}

      {/* ==================================================
          CATEGORY LIST
          ================================================== */}

      <div className="categories-list">
        {categories.map((category) => (
          <div
            className="category-item"
            key={category._id}
          >
            <div>
              <h3>{category.name}</h3>

              <p>
                {category.type === "expense"
                  ? "Expense"
                  : "Income"}
              </p>
            </div>

            <div className="category-actions">
              {category.isDefault ? (
                <span>Default</span>
              ) : (
                <>
                  {/* EDIT */}

                  <button
                    type="button"
                    title="Edit category"
                    onClick={() =>
                      handleEditCategory(category)
                    }
                  >
                    <Pencil size={18} />
                  </button>

                  {/* DELETE */}

                  <button
                    type="button"
                    title="Delete category"
                    onClick={() =>
                      handleDeleteClick(category)
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ==================================================
          ADD / EDIT CATEGORY FORM
          ================================================== */}

      {showForm && (
        <div className="category-form">
          <div className="category-form-card">

            {/* CLOSE */}

            <button
              type="button"
              className="modal-close"
              onClick={closeForm}
              disabled={submitting}
            >
              ×
            </button>

            {/* TITLE */}

            <h2>
              {editingCategory
                ? "Edit Category"
                : "Add Category"}
            </h2>

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
        <div className="delete-modal">
          <div className="delete-modal-card">

            <button
              type="button"
              className="modal-close"
              onClick={closeDeleteModal}
              disabled={deleting}
            >
              ×
            </button>

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
                  Delete Category
                </h2>

                <p>
                  Are you sure you want to delete{" "}
                  <strong>
                    {deletingCategory.name}
                  </strong>
                  ?
                </p>

                <p>
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
                    onClick={handleDeleteCategory}
                    disabled={deleting}
                  >
                    {deleting
                      ? "Deleting..."
                      : "Delete Category"}
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