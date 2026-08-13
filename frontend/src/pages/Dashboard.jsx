import { useEffect, useState } from "react";
import SummaryCard from "../components/dashboard/SummaryCard";
import { getDashboardSummary } from "../services/dashboardService";

function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                const token = localStorage.getItem("token");

                const data = await getDashboardSummary(token);

                setSummary(data.summary);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    if (loading) {
        return <h1>Loading dashboard...</h1>;
    }

    if (error) {
        return <h1>{error}</h1>;
    }

    return (
        <div className="dashboard">

            <div className="dashboard-header">
                <h1>Welcome back!</h1>

                <p>
                    Here's what's happening with your money.
                </p>
            </div>

            <div className="summary-grid">

                <SummaryCard
                    title="Total Balance"
                    amount={summary.balance}
                />

                <SummaryCard
                    title="Total Income"
                    amount={summary.totalIncome}
                />

                <SummaryCard
                    title="Total Expenses"
                    amount={summary.totalExpense}
                />

            </div>

        </div>
    );
}

export default Dashboard;