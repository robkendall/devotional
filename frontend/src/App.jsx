import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Box, ThemeProvider, Typography, createTheme, CssBaseline } from "@mui/material";
import RequireAuth from "./components/RequireAuth";
import Navigation, { DESKTOP_NAV_WIDTH } from "./components/Navigation";

import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import New from "./pages/New";
import Archive from "./pages/Archive";
import ViewEntry from "./pages/ViewEntry";
import UserProfile from "./pages/UserProfile";
import HowTo from "./pages/HowTo";
import PrayerJournal from "./pages/PrayerJournal";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#646cff",
    },
    secondary: {
      main: "#535bf2",
    },
    background: {
      default: "#242424",
      paper: "#1a1a1a",
    },
  },
  typography: {
    fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
  },
});

function AppRoutes() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/") return "Dashboard";
    if (path === "/new") return "New Entry";
    if (path === "/archive") return "Archive";
    if (path === "/how-to") return "How To";
    if (path === "/prayer-journal") return "Prayer Journal";
    if (path === "/profile") return "Profile";
    if (path === "/logout") return "Logout";
    if (path.startsWith("/entry/")) return "Entry";

    return "";
  };

  const pageTitle = isAuthPage ? "" : getPageTitle();

  return (
    <Box sx={{ display: isAuthPage ? "block" : "flex", minHeight: "100vh" }}>
      {!isAuthPage && <Navigation />}
      <Box sx={{ flex: 1, ml: isAuthPage ? 0 : { xs: 0, md: `${DESKTOP_NAV_WIDTH}px` } }}>
        {!isAuthPage && pageTitle && (
          <Box sx={{ px: { xs: 9, md: 4 }, pt: { xs: 3, md: 4 }, pb: 1, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                color: "#f4f7fb",
                fontSize: { xs: "1.5rem", md: "2rem" },
                fontWeight: 600,
                letterSpacing: "0.01em",
                textDecoration: "underline",
                textUnderlineOffset: "0.22em",
                textDecorationThickness: "2px",
              }}
            >
              {pageTitle}
            </Typography>
          </Box>
        )}
        <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/new"
          element={
            <RequireAuth>
              <New />
            </RequireAuth>
          }
        />

        <Route
          path="/archive"
          element={
            <RequireAuth>
              <Archive />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <UserProfile />
            </RequireAuth>
          }
        />

        <Route
          path="/how-to"
          element={
            <RequireAuth>
              <HowTo />
            </RequireAuth>
          }
        />

        <Route
          path="/prayer-journal"
          element={
            <RequireAuth>
              <PrayerJournal />
            </RequireAuth>
          }
        />

        <Route
          path="/entry/:id"
          element={
            <RequireAuth>
              <ViewEntry />
            </RequireAuth>
          }
        />

        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;