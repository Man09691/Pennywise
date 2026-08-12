import SummaryCard from "../components/dashboard/SummaryCard";

function Dashboard() {
    return (
        <div className="dashboard">

            <div className="dashboard-header">
                <h1>Welcome back!</h1>
                <p>Here's what's happening with your money.</p>
            </div>

            <div className="summary-grid">

                <SummaryCard
                    title="Total Balance"
                    amount="49,100"
                />

                <SummaryCard
                    title="Total Income"
                    amount="50,000"
                />

                <SummaryCard
                    title="Total Expenses"
                    amount="900"
                />

            </div>

        </div>
    );
}

export default Dashboard;