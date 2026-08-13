import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                
                <Route path="/login" element={<Login />} />

                <Route path="/signup" element={<Signup />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/transactions" element={<Transactions />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;