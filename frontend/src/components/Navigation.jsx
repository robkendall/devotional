import { useMemo, useState } from "react";
import {
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useNavigate, useLocation } from "react-router-dom";

export const DESKTOP_NAV_WIDTH = 84;
const DESKTOP_NAV_EXPANDED_WIDTH = 260;

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopExpanded, setDesktopExpanded] = useState(false);

    const currentRoute = useMemo(() => {
        const path = location.pathname;

        if (path.startsWith("/entry/")) return "/archive";
        return path;
    }, [location.pathname]);

    const primaryItems = [
        { label: "New", path: "/new", icon: <AddCircleOutlineIcon /> },
        { label: "Archive", path: "/archive", icon: <FolderOutlinedIcon /> },
        { label: "How To", path: "/how-to", icon: <HelpOutlineIcon /> },
        { label: "Prayer Journal", path: "/prayer-journal", icon: <BookOutlinedIcon /> },
    ];

    const secondaryItems = [
        { label: "Profile", path: "/profile", icon: <PersonOutlineIcon /> },
        { label: "Logout", path: "/logout", icon: <LogoutIcon /> },
    ];

    const renderNavItem = (item) => {
        const selected = currentRoute === item.path;

        return (
            <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => {
                    setMobileOpen(false);
                    setDesktopExpanded(false);
                    navigate(item.path);
                }}
                sx={{
                    borderRadius: 2,
                    mb: 1,
                    px: desktopExpanded ? 1.25 : 1,
                    py: 1.15,
                    color: selected ? "#10131a" : "#f4f7fb",
                    backgroundColor: selected ? "#f4f7fb" : "transparent",
                    justifyContent: desktopExpanded ? "flex-start" : "center",
                    "& .MuiListItemIcon-root": {
                        color: selected ? "#10131a" : "#90a2ff",
                        minWidth: desktopExpanded ? 40 : 0,
                        mr: desktopExpanded ? 1.25 : 0,
                    },
                    "&:hover": {
                        backgroundColor: selected ? "#f4f7fb" : "rgba(255, 255, 255, 0.08)",
                    },
                    "&.Mui-selected": {
                        backgroundColor: "#f4f7fb",
                    },
                    "&.Mui-selected:hover": {
                        backgroundColor: "#f4f7fb",
                    },
                }}
            >
                <ListItemIcon>{item.icon}</ListItemIcon>
                {desktopExpanded ? <ListItemText primary={item.label} /> : null}
            </ListItemButton>
        );
    };

    const railContent = (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box
                sx={{
                    px: desktopExpanded ? 1 : 0.5,
                    pt: 2,
                    pb: 2,
                    display: "flex",
                    flexDirection: desktopExpanded ? "row" : "column",
                    alignItems: "center",
                    justifyContent: desktopExpanded ? "space-between" : "center",
                    gap: desktopExpanded ? 1 : 1.5,
                }}
            >
                <IconButton
                    onClick={() => setDesktopExpanded((value) => !value)}
                    sx={{
                        width: 44,
                        height: 44,
                        color: "#f4f7fb",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(144, 162, 255, 0.18)",
                        "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                    }}
                >
                    <MenuIcon />
                </IconButton>

                {desktopExpanded ? (
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="overline" sx={{ color: "#90a2ff", letterSpacing: "0.16em" }}>
                            Navigation
                        </Typography>
                        <Typography variant="subtitle1" noWrap>
                            Reading & Reflecting
                        </Typography>
                    </Box>
                ) : null}
            </Box>

            <List sx={{ px: 0.5 }}>
                {primaryItems.map(renderNavItem)}
            </List>

            <Box sx={{ mt: "auto", px: 0.5, pb: 1 }}>
                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mb: 1.5 }} />
                <List>
                    {secondaryItems.map(renderNavItem)}
                </List>
            </Box>
        </Box>
    );

    return (
        <>
            <Tooltip title={open ? "Close menu" : "Open menu"}>
                <IconButton
                    onClick={() => setMobileOpen((value) => !value)}
                    sx={{
                        position: "fixed",
                        top: 16,
                        left: 16,
                        zIndex: 1301,
                        width: 48,
                        height: 48,
                        color: "#f4f7fb",
                        backgroundColor: "rgba(17, 22, 31, 0.88)",
                        border: "1px solid rgba(144, 162, 255, 0.22)",
                        backdropFilter: "blur(10px)",
                        "&:hover": {
                            backgroundColor: "rgba(17, 22, 31, 0.96)",
                        },
                        display: { xs: "inline-flex", md: "none" },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            </Tooltip>

            <Box
                sx={{
                    display: { xs: "none", md: "flex" },
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    zIndex: 1200,
                    width: desktopExpanded ? DESKTOP_NAV_EXPANDED_WIDTH : DESKTOP_NAV_WIDTH,
                    backgroundColor: "#10131a",
                    color: "#f4f7fb",
                    borderRight: "1px solid rgba(144, 162, 255, 0.16)",
                    px: 1,
                    py: 1.5,
                    transition: "width 180ms ease",
                    overflowX: "hidden",
                }}
            >
                {railContent}
            </Box>

            <Drawer
                anchor="left"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                PaperProps={{
                    sx: {
                        width: { xs: 280, sm: 308 },
                        backgroundColor: "#10131a",
                        color: "#f4f7fb",
                        borderRight: "1px solid rgba(144, 162, 255, 0.16)",
                        px: 1.5,
                        py: 2,
                    },
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <Box sx={{ px: 1, pt: 5, pb: 2 }}>
                        <Typography variant="overline" sx={{ color: "#90a2ff", letterSpacing: "0.16em" }}>
                            Navigation
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>
                            Reading & Reflecting
                        </Typography>
                    </Box>

                    <List sx={{ px: 0.5 }}>
                        {primaryItems.map((item) => {
                            const selected = currentRoute === item.path;

                            return (
                                <ListItemButton
                                    key={item.path}
                                    selected={selected}
                                    onClick={() => {
                                        setMobileOpen(false);
                                        navigate(item.path);
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        px: 1.25,
                                        py: 1.15,
                                        color: selected ? "#10131a" : "#f4f7fb",
                                        backgroundColor: selected ? "#f4f7fb" : "transparent",
                                        "& .MuiListItemIcon-root": {
                                            color: selected ? "#10131a" : "#90a2ff",
                                            minWidth: 40,
                                        },
                                        "&:hover": {
                                            backgroundColor: selected ? "#f4f7fb" : "rgba(255, 255, 255, 0.08)",
                                        },
                                        "&.Mui-selected": {
                                            backgroundColor: "#f4f7fb",
                                        },
                                        "&.Mui-selected:hover": {
                                            backgroundColor: "#f4f7fb",
                                        },
                                    }}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            );
                        })}
                    </List>

                    <Box sx={{ mt: "auto", px: 0.5, pb: 1 }}>
                        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mb: 1.5 }} />
                        <List>
                            {secondaryItems.map((item) => {
                                const selected = currentRoute === item.path;

                                return (
                                    <ListItemButton
                                        key={item.path}
                                        selected={selected}
                                        onClick={() => {
                                            setMobileOpen(false);
                                            navigate(item.path);
                                        }}
                                        sx={{
                                            borderRadius: 2,
                                            mb: 1,
                                            px: 1.25,
                                            py: 1.15,
                                            color: selected ? "#10131a" : "#f4f7fb",
                                            backgroundColor: selected ? "#f4f7fb" : "transparent",
                                            "& .MuiListItemIcon-root": {
                                                color: selected ? "#10131a" : "#90a2ff",
                                                minWidth: 40,
                                            },
                                            "&:hover": {
                                                backgroundColor: selected ? "#f4f7fb" : "rgba(255, 255, 255, 0.08)",
                                            },
                                            "&.Mui-selected": {
                                                backgroundColor: "#f4f7fb",
                                            },
                                            "&.Mui-selected:hover": {
                                                backgroundColor: "#f4f7fb",
                                            },
                                        }}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.label} />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
