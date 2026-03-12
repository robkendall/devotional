import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Typography,
    Stack,
} from "@mui/material";

export default function Dashboard() {
    const navigate = useNavigate();

    const navItems = [
        { label: "New", path: "/new" },
        { label: "Archive", path: "/archive" },
        { label: "User Profile", path: "/profile" },
    ];

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 3,
                    }}
                >
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body1" color="text.secondary">
                            Welcome back! You are logged in.
                        </Typography>
                    </Box>

                    <Stack spacing={2} sx={{ width: "100%", maxWidth: 900 }}>
                        {navItems.map((item) => (
                            <Button
                                key={item.path}
                                fullWidth
                                variant="outlined"
                                size="large"
                                onClick={() => navigate(item.path)}
                            >
                                {item.label}
                            </Button>
                        ))}

                        <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            size="large"
                            onClick={() => navigate("/logout")}
                            sx={{ mt: 2 }}
                        >
                            Logout
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}