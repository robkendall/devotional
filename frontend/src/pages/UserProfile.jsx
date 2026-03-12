import { Box, Typography } from "@mui/material";

export default function UserProfile() {
    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: 2,
                    }}
                >
                    <Typography component="h1" variant="h3" gutterBottom>
                        User Profile
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your profile here.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
