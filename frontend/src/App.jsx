import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";

import Sidebar from "./components/layout/Sidebar";


function AppLayout({ children }) {
    return (
        <div className="app-layout">

            <Sidebar />

            <main className="main-content">
                <div className="page-content">
                    {children}
                </div>
            </main>

        </div>
    );
}


function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* Public pages */}
                <Route path="/" element={<Login />} />

                <Route path="/login" element={<Login />} />

                <Route path="/signup" element={<Signup />} />


                {/* Application pages */}
                <Route
                    path="/dashboard"
                    element={
                        <AppLayout>
                            <Dashboard />
                        </AppLayout>
                    }
                />

                <Route
                    path="/transactions"
                    element={
                        <AppLayout>
                            <Transactions />
                        </AppLayout>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;