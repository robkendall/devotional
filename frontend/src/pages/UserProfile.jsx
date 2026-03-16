import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { getCurrentUser } from "../api/auth";
import { apiFetch } from "../api/client";

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        getCurrentUser()
            .then((resolvedUser) => setUser(resolvedUser))
            .catch(() => setUser(null));
    }, []);

    const handleChangePassword = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("New password and confirmation do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await apiFetch("/api/me/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload.error || "Failed to change password.");
            }

            setSuccess("Password updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Paper sx={{ p: 3, maxWidth: 640, mx: "auto" }}>
                    <Typography component="h1" variant="h4" sx={{ mb: 1 }}>
                        User Profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {user?.email ? `Signed in as ${user.email}` : "Manage your account settings."}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Box component="form" onSubmit={handleChangePassword} sx={{ display: "grid", gap: 2 }}>
                        <TextField
                            label="Current Password"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            required
                        />

                        <TextField
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            required
                        />

                        <TextField
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                        />

                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? "Updating..." : "Change Password"}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
