import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";

import MainLayout from "./components/layout/MainLayout";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Authentication pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Application pages */}
                <Route
                    path="/dashboard"
                    element={
                        <MainLayout>
                            <Dashboard />
                        </MainLayout>
                    }
                />

                <Route
                    path="/transactions"
                    element={
                        <MainLayout>
                            <Transactions />
                        </MainLayout>
                    }
                />

                <Route
                    path="/budgets"
                    element={
                        <MainLayout>
                            <Budgets />
                        </MainLayout>
                    }
                />

                <Route
                    path="/categories"
                    element={
                        <MainLayout>
                            <Categories />
                        </MainLayout>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <MainLayout>
                            <Profile />
                        </MainLayout>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;