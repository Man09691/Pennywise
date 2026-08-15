import { useEffect, useState } from "react";
import { apiRequest } from "../services/api.js";
import { Pencil, Trash2, Plus } from "lucide-react";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add / Edit form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
  });

  // --------------------------------------------------
  // Load categories
  // --------------------------------------------------

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/categories");

      setCategories(data.categories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Load categories when page opens
  // --------------------------------------------------

  useEffect(() => {
    loadCategories();
  }, []);

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
  // Open Add Category form
  // --------------------------------------------------

  function handleAddCategory() {
    setError("");
    setEditingCategory(null);

    setFormData({
      name: "",
      type: "expense",
    });

    setShowForm(true);
  }

  // --------------------------------------------------
  // Open Edit Category form
  // --------------------------------------------------

  function handleEditCategory(category) {
    setError("");

    setEditingCategory(category);

    setFormData({
      name: category.name,
      type: category.type,
    });

    setShowForm(true);
  }

  // --------------------------------------------------
  // Close Add / Edit form
  // --------------------------------------------------

  function closeForm() {
    setShowForm(false);
    setEditingCategory(null);
    setError("");

    setFormData({
      name: "",
      type: "expense",
    });
  }

  // --------------------------------------------------
  // Add / Edit Category
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    if (!formData.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSubmitting(true);

    try {
      // Edit existing category
      if (editingCategory) {
        await apiRequest(`/categories/${editingCategory._id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formData.name.trim(),
            type: formData.type,
          }),
        });
      }

      // Add new category
      else {
        await apiRequest("/categories", {
          method: "POST",
          body: JSON.stringify({
            name: formData.name.trim(),
            type: formData.type,
          }),
        });
      }

      // Reload categories after successful operation
      await loadCategories();

      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------
  // Open Delete Confirmation Modal
  // --------------------------------------------------

  function handleDeleteClick(category) {
    setError("");
    setDeleteError("");
    setDeletingCategory(category);
    setShowDeleteModal(true);
  }

  // --------------------------------------------------
  // Close Delete Confirmation Modal
  // --------------------------------------------------

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setDeletingCategory(null);
    setDeleteError("");
  }
  // --------------------------------------------------
  // Delete Category
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return <h1>Loading categories...</h1>;
  }

  // --------------------------------------------------
  // Page error
  // --------------------------------------------------

  if (error && !showForm && !showDeleteModal) {
    return <h1>Error: {error}</h1>;
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="categories-page">
      {/* Header */}

      <div className="categories-header">
        <div>
          <h1>Categories</h1>

          <p>Manage your expense and income categories.</p>
        </div>

        <button type="button" onClick={handleAddCategory}>
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Page Error */}

      {error && !showForm && !showDeleteModal && (
        <p className="form-error">{error}</p>
      )}

      {/* Categories List */}

      <div className="categories-list">
        {categories.map((category) => (
          <div className="category-item" key={category._id}>
            <div>
              <h3>{category.name}</h3>

              <p>{category.type === "expense" ? "Expense" : "Income"}</p>
            </div>

            <div className="category-actions">
              {category.isDefault ? (
                <span>Default</span>
              ) : (
                <>
                  {/* Edit */}

                  <button
                    type="button"
                    title="Edit category"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Pencil size={18} />
                  </button>

                  {/* Delete */}

                  <button
                    type="button"
                    title="Delete category"
                    onClick={() => handleDeleteClick(category)}
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}

      {showForm && (
        <div className="category-form">
          <div className="category-form-card">
            {/* Close */}

            <button type="button" className="modal-close" onClick={closeForm}>
              ×
            </button>

            {/* Form Title */}

            <h2>{editingCategory ? "Edit Category" : "Add Category"}</h2>

            {/* Form Error */}

            {error && <p className="form-error">{error}</p>}

            <form onSubmit={handleSubmit}>
              {/* Category Name */}

              <div className="form-group">
                <label>Category Name</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter category name"
                />
              </div>

              {/* Category Type */}

              <div className="form-group">
                <label>Type</label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="expense">Expense</option>

                  <option value="income">Income</option>
                </select>
              </div>

              {/* Buttons */}

              <div>
                <button type="button" onClick={closeForm}>
                  Cancel
                </button>

                <button type="submit" disabled={submitting}>
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

      {/* Delete Confirmation Modal */}

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
                <h2>Cannot Delete Category</h2>

                <p className="form-error">{deleteError}</p>

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
                <h2>Delete Category</h2>

                <p>
                  Are you sure you want to delete{" "}
                  <strong>{deletingCategory.name}</strong>?
                </p>

                <p>
                  If this category is being used by transactions, the deletion
                  will be prevented.
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
                    {deleting ? "Deleting..." : "Delete Category"}
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
