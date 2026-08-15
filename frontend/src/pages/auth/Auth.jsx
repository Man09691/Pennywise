import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { apiRequest } from "../../services/api";

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(location.pathname === "/signup");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Login
  // --------------------------------------------------

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(loginData.email, loginData.password);

      localStorage.setItem("token", data.token);

      // Login successful -> Dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Signup
  // --------------------------------------------------

  async function handleSignup(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (
      !signupData.name.trim() ||
      !signupData.email.trim() ||
      !signupData.password
    ) {
      setError("All fields are required.");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: signupData.name.trim(),
          email: signupData.email.trim(),
          password: signupData.password,
        }),
      });

      localStorage.setItem("token", data.token);

      // Signup successful -> Dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // Login field change
  // --------------------------------------------------

  function handleLoginChange(event) {
    const { name, value } = event.target;

    setLoginData({
      ...loginData,
      [name]: value,
    });
  }

  // --------------------------------------------------
  // Signup field change
  // --------------------------------------------------

  function handleSignupChange(event) {
    const { name, value } = event.target;

    setSignupData({
      ...signupData,
      [name]: value,
    });
  }

  // --------------------------------------------------
  // Switch Auth Mode
  // --------------------------------------------------

  function switchMode(mode) {
    setError("");
    setIsSignUp(mode === "signup");
  }

  return (
    <div className={`auth-page ${isSignUp ? "signup-mode" : ""}`}>
      <div className="auth-container">
        {/* =========================================
                    LOGIN FORM
                ========================================= */}

        <div className="auth-form-panel login-panel">
          <div className="auth-form-content">
            <h1>Sign In</h1>

            <p className="auth-subtitle">Login to your Pennywise account</p>

            {error && !isSignUp && <div className="auth-error">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="auth-input">
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="Email"
                  required
                />
              </div>

              <div className="auth-input">
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Signing In..." : "SIGN IN"}
              </button>
            </form>
          </div>
        </div>

        {/* =========================================
                    SIGNUP FORM
                ========================================= */}

        <div className="auth-form-panel signup-panel">
          <div className="auth-form-content">
            <h1>Create Account</h1>

            <p className="auth-subtitle">Create your Pennywise account</p>

            {error && isSignUp && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSignup}>
              <div className="auth-input">
                <input
                  type="text"
                  name="name"
                  value={signupData.name}
                  onChange={handleSignupChange}
                  placeholder="Name"
                  required
                />
              </div>

              <div className="auth-input">
                <input
                  type="email"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  placeholder="Email"
                  required
                />
              </div>

              <div className="auth-input">
                <input
                  type="password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  placeholder="Password"
                  required
                />
              </div>

              <div className="auth-input">
                <input
                  type="password"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  placeholder="Confirm Password"
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Creating..." : "SIGN UP"}
              </button>
            </form>
          </div>
        </div>

        {/* =========================================
                    SLIDING SIDE PANEL
                ========================================= */}

        <div className="auth-overlay">
          <div className="auth-overlay-panel">
            {!isSignUp ? (
              <>
                <h1>Hello, Friend!</h1>

                <p>
                  Enter your personal details and start your journey with us.
                </p>

                <button
                  type="button"
                  className="auth-outline-button"
                  onClick={() => switchMode("signup")}
                >
                  SIGN UP
                </button>
              </>
            ) : (
              <>
                <h1>Welcome Back!</h1>

                <p>
                  To keep connected with us please login with your personal
                  info.
                </p>

                <button
                  type="button"
                  className="auth-outline-button"
                  onClick={() => switchMode("login")}
                >
                  SIGN IN
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
