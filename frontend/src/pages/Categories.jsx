import { useEffect, useState } from "react";
import { apiRequest } from "../services/api.js";

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCategories() {
            try {
                const data = await apiRequest("/categories");
                setCategories(data.categories);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadCategories();
    }, []);

    if (loading) return <h1>Loading categories...</h1>;
    if (error) return <h1>Error: {error}</h1>;

    return (
        <div>
            <h1>Categories</h1>
            <pre>{JSON.stringify(categories, null, 2)}</pre>
        </div>
    );
}

export default Categories;