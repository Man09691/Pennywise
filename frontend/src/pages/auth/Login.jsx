import { useState } from "react";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(event) {
        event.preventDefault();

        console.log("Login submitted:", {
            email,
            password,
        });
    }

    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-header">
                    <div className="brand-logo">P</div>

                    <h1>Welcome back</h1>

                    <p>
                        Login to your Pennywise account
                    </p>
                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit">
                        Login
                    </button>

                </form>

            </div>

        </div>
    );
}

export default Login;