import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { logout } from "../api/auth";

export default function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                await logout();
            } catch (err) {
                console.error("Logout error:", err);
            } finally {
                navigate("/login", { replace: true });
            }
        };

        handleLogout();
    }, [navigate]);

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                    }}
                >
                    <CircularProgress />
                    <Typography variant="body1" color="text.secondary">
                        Logging out...
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
