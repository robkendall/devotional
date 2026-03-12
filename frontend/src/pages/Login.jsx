import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    Link,
} from "@mui/material";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                navigate("/"); // redirect to main app
            } else {
                setError("Invalid email or password");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%" }}>
            <Box sx={{ maxWidth: "1200px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Paper
                    elevation={3}
                    sx={{
                        padding: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Typography component="h1" variant="h4" sx={{ textAlign: "center", mb: 2 }}>
                        Login
                    </Typography>

                    {error && <Alert severity="error">{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            fullWidth
                            id="email"
                            label="Email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />

                        <TextField
                            fullWidth
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 1 }}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </Box>

                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2">
                            Don't have an account?{" "}
                            <Link
                                component="button"
                                variant="body2"
                                onClick={() => navigate("/register")}
                                sx={{ cursor: "pointer" }}
                            >
                                Register here
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}