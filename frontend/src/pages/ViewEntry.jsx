import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    Stack,
    Divider,
    IconButton,
    Paper,
    Grid,
    CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const REFLECTION_TYPES = [
    "Principle to live by",
    "Sin to forsake",
    "Hope to celebrate",
    "Example to follow",
    "Insight about the church to apply",
    "Command to obey",
    "Error to avoid",
    "Promise to claim",
    "Perspective to adopt",
];

export default function ViewEntry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [showScripture, setShowScripture] = useState(false);
    const [formData, setFormData] = useState(null);
    const [date, setDate] = useState("");

    useEffect(() => {
        fetchEntry();
    }, [id]);

    const fetchEntry = async () => {
        try {
            const response = await fetch(`/api/entries/${id}`, {
                credentials: "include",
            });

            if (response.ok) {
                const entry = await response.json();
                setFormData({
                    scripture: entry.scripture || "",
                    scriptureText: entry.scripture_text || "",
                    prayRead: entry.pray_read || "",
                    prrCheckboxes: Array.isArray(entry.prr_checkboxes) 
                        ? entry.prr_checkboxes 
                        : JSON.parse(entry.prr_checkboxes),
                    reflectionTypes: Array.isArray(entry.reflection_types) 
                        ? entry.reflection_types 
                        : JSON.parse(entry.reflection_types),
                    godAboutHimself: entry.god_about_himself || "",
                    godAboutUs: entry.god_about_us || "",
                    godToldMePersonally: entry.god_told_me_personally || "",
                    myResponse: entry.my_response || "",
                    takeaway: entry.takeaway || "",
                });
                setDate(new Date(entry.date).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    timeZone: "UTC",
                                                }));
            } else {
                navigate("/archive");
            }
        } catch (error) {
            console.error("Error fetching entry:", error);
            navigate("/archive");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
                <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2, display: "flex", justifyContent: "center" }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (!formData) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
                <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                    <Typography>Entry not found</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <IconButton onClick={() => navigate("/archive")} size="small">
                        <ArrowBackIcon />
                    </IconButton>
                </Box>

                <Typography variant="h4" sx={{ textAlign: "center", color: "text.secondary", mb: 4 }}>
                    {date}
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {/* Scripture with Show/Hide */}
                    <Box>
                        <Grid container spacing={1} alignItems="flex-start">
                            <Grid item xs={11}>
                                <TextField
                                    fullWidth
                                    label="Scripture Reference"
                                    value={formData.scripture}
                                    disabled
                                />
                            </Grid>
                        </Grid>

                        {showScripture && formData.scriptureText && (
                            <Paper
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    backgroundColor: "rgba(100, 108, 255, 0.05)",
                                    borderLeft: "4px solid",
                                    borderColor: "primary.main",
                                }}
                            >
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    value={formData.scriptureText}
                                    disabled
                                    variant="standard"
                                    sx={{
                                        mt: 1,
                                        "& .MuiInputBase-input": {
                                            fontSize: "1.1rem",
                                        },
                                    }}
                                />
                            </Paper>
                        )}
                    </Box>

                    <Divider />

                    {/* P R R Checkboxes */}
                    <Box>
                        <Typography variant="h5" sx={{ mb: 2, color: "primary.main" }}>
                            PRAY, REFLECT, RESPOND
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            {["P", "R", "R"].map((label, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    control={
                                        <Checkbox
                                            checked={formData.prrCheckboxes[idx]}
                                            disabled
                                        />
                                    }
                                    label={label}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Divider />

                    {/* PRAY & READ Section */}
                    <Box>
                        <Typography variant="h5" sx={{ mb: 1, color: "primary.main" }}>
                            PRAY & READ
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", mb: 2, color: "text.secondary" }}>
                            KEY VERSE OR PHRASE FOR TODAY
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            value={formData.prayRead}
                            disabled
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: "1.1rem",
                                },
                            }}
                        />
                    </Box>

                    <Divider />

                    {/* THIS IS A... Section */}
                    <Box>
                        <Typography variant="caption" sx={{ display: "block", mb: 2, color: "text.secondary" }}>
                            THIS IS A...
                        </Typography>
                        <Stack direction="column" spacing={0}>
                            {REFLECTION_TYPES.map((type, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    control={
                                        <Checkbox
                                            checked={formData.reflectionTypes[idx]}
                                            disabled
                                        />
                                    }
                                    label={type}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Divider />

                    {/* REFLECT Section */}
                    <Box>
                        <Typography variant="h5" sx={{ mb: 3, color: "primary.main" }}>
                            REFLECT
                        </Typography>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" sx={{ display: "block", mb: 2, color: "text.secondary" }}>
                                WHAT GOD SHOWS US ABOUT HIMSELF
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                value={formData.godAboutHimself}
                                disabled
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "1.1rem",
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" sx={{ display: "block", mb: 2, color: "text.secondary" }}>
                                WHAT GOD SHOWS US ABOUT US
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                value={formData.godAboutUs}
                                disabled
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "1.1rem",
                                    },
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="caption" sx={{ display: "block", mb: 2, color: "text.secondary" }}>
                                WHAT GOD TOLD ME PERSONALLY
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                value={formData.godToldMePersonally}
                                disabled
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "1.1rem",
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* RESPOND Section */}
                    <Box>
                        <Typography variant="h5" sx={{ mb: 2, color: "primary.main" }}>
                            RESPOND
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", mb: 2, color: "text.secondary" }}>
                            MY RESPONSE TO HIM
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            value={formData.myResponse}
                            disabled
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: "1.1rem",
                                },
                            }}
                        />
                    </Box>

                    <Divider />

                    {/* COMMIT Section */}
                    <Box>
                        <Typography variant="h5" sx={{ mb: 2, color: "primary.main" }}>
                            COMMIT
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", mb: 2, color: "text.secondary" }}>
                            MY TAKEAWAY FOR TODAY (Key truth in a brief phrase)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.takeaway}
                            disabled
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: "1.1rem !important",
                                },
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
