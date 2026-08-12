function SummaryCard({ title, amount }) {
    return (
        <div className="summary-card">
            <p>{title}</p>
            <h2>₹{amount}</h2>
        </div>
    );
}

export default SummaryCard;