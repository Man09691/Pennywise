import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function MainLayout({ children }) {
    return (
        <div className="app-layout">

            <Sidebar />

            <main className="main-content">

                <Navbar />

                <div className="page-content">
                    {children}
                </div>

            </main>

        </div>
    );
}

export default MainLayout;