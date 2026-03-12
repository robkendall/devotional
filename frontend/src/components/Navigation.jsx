import { Box, Button, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const getTitleFromPath = () => {
        const path = location.pathname;
        if (path === "/new") return "New Entry";
        if (path === "/archive") return "Archive";
        if (path === "/profile") return "Profile";
        if (path === "/entry") return "Entry";
        if (path.startsWith("/entry/")) return "Entry";
        if (path === "/") return "Dashboard";
        return "";
    };

    const pageTitle = getTitleFromPath();

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: { xs: 1, sm: 2 },
                padding: { xs: "0.5rem 0.75rem", sm: "1rem 2rem" },
                backgroundColor: "#1a1a1a",
                borderBottom: "1px solid #333",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            {/* Left side - New and Archive */}
            <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 3 }, flex: 1, minWidth: 0 }}>
                <Button
                    variant="text"
                    onClick={() => navigate("/new")}
                    sx={{
                        color: "#646cff",
                        minWidth: "auto",
                        px: { xs: 0.5, sm: 1.5 },
                        py: { xs: 0.25, sm: 0.75 },
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        "&:hover": { color: "#535bf2" },
                    }}
                >
                    New
                </Button>

                <Button
                    variant="text"
                    onClick={() => navigate("/archive")}
                    sx={{
                        color: "#646cff",
                        minWidth: "auto",
                        px: { xs: 0.5, sm: 1.5 },
                        py: { xs: 0.25, sm: 0.75 },
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        "&:hover": { color: "#535bf2" },
                    }}
                >
                    Archive
                </Button>
            </Box>

            {/* Center - Page Title */}
            {pageTitle && (
                <Box sx={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                    <Typography
                        variant="h5"
                        noWrap
                        sx={{
                            color: "white",
                            fontSize: { xs: "1rem", sm: "1.5rem" },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {pageTitle}
                    </Typography>
                </Box>
            )}

            {/* Right side - Profile and Logout */}
            <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 2 }, flex: 1, justifyContent: "flex-end", minWidth: 0 }}>
                <Button
                    variant="text"
                    onClick={() => navigate("/profile")}
                    sx={{
                        color: "#646cff",
                        minWidth: "auto",
                        px: { xs: 0.5, sm: 1.5 },
                        py: { xs: 0.25, sm: 0.75 },
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        "&:hover": { color: "#535bf2" },
                    }}
                >
                    Profile
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => navigate("/logout")}
                    sx={{
                        minWidth: "auto",
                        px: { xs: 0.75, sm: 1.5 },
                        py: { xs: 0.4, sm: 0.75 },
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                    }}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );
}
