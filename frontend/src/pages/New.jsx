import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const subheaderSx = {
    display: "block",
    mb: 2,
    color: "text.secondary",
};

export default function New() {
    const navigate = useNavigate();
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
    const isoDate = today.toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        scripture: "",
        scriptureText: "",
        prayRead: "",
        prrCheckboxes: [false, false, false],
        reflectionTypes: REFLECTION_TYPES.map(() => false),
        godAboutHimself: "",
        godAboutUs: "",
        godToldMePersonally: "",
        myResponse: "",
        takeaway: "",
    });

    const [showScripture, setShowScripture] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCheckboxChange = (index, field) => {
        setFormData(prev => {
            const updated = [...prev[field]];
            updated[index] = !updated[index];
            return {
                ...prev,
                [field]: updated,
            };
        });
    };

    const saveEntry = async () => {
        const submissionData = {
            ...formData,
            date: isoDate,
        };

        try {
            const response = await fetch("/api/entry", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionData),
            });

            if (response.ok) {
                return { ok: true };
            } else {
                console.error("Failed to save entry:", response.status);
                return { ok: false, message: "Failed to save entry." };
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            return { ok: false, message: "Error submitting form." };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await saveEntry();

        setLoading(false);

        if (result.ok) {
            navigate("/archive");
        }
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Typography variant="h4" sx={{ textAlign: "center", color: "text.secondary", mb: 4 }}>
                    {formattedDate}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {/* Scripture with Show/Hide */}
                    <Box>
                        <Grid container spacing={1} alignItems="flex-start">
                            <Grid item xs={11}>
                                <TextField
                                    fullWidth
                                    name="scripture"
                                    label="Scripture Reference"
                                    placeholder="e.g., John 1:1-2"
                                    value={formData.scripture}
                                    onChange={handleInputChange}
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
                                    name="scriptureText"
                                    value={formData.scriptureText}
                                    onChange={handleInputChange}
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

                    {/* PRAY & READ Section */}
                    <Box>
                        <Box
                            sx={{
                                mb: 1,
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 2,
                            }}
                        >
                            <Typography variant="h5" sx={{ color: "primary.main", mb: 0 }}>
                                PRAY & READ
                            </Typography>
                            <Stack direction="row" spacing={3}>
                                {["P", "R", "R"].map((label, idx) => (
                                    <FormControlLabel
                                        key={idx}
                                        control={
                                            <Checkbox
                                                checked={formData.prrCheckboxes[idx]}
                                                onChange={() => handleCheckboxChange(idx, "prrCheckboxes")}
                                            />
                                        }
                                        label={label.replace("P", "Pray").replace("R", "Read")}
                                    />
                                ))}
                            </Stack>
                        </Box>
                        <Typography variant="body2" sx={subheaderSx}>
                            KEY VERSE OR PHRASE FOR TODAY
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            name="prayRead"
                            value={formData.prayRead}
                            onChange={handleInputChange}
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
                        <Typography variant="body2" sx={subheaderSx}>
                            THIS IS A...
                        </Typography>
                        <Stack direction="column" spacing={0}>
                            {REFLECTION_TYPES.map((type, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    control={
                                        <Checkbox
                                            checked={formData.reflectionTypes[idx]}
                                            onChange={() => handleCheckboxChange(idx, "reflectionTypes")}
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
                            <Typography variant="body2" sx={subheaderSx}>
                                WHAT GOD SHOWS US ABOUT HIMSELF
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                name="godAboutHimself"
                                value={formData.godAboutHimself}
                                onChange={handleInputChange}
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "1.1rem",
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" sx={subheaderSx}>
                                WHAT GOD SHOWS US ABOUT US
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                name="godAboutUs"
                                value={formData.godAboutUs}
                                onChange={handleInputChange}
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "1.1rem",
                                    },
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body2" sx={subheaderSx}>
                                WHAT GOD TOLD ME PERSONALLY
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                name="godToldMePersonally"
                                value={formData.godToldMePersonally}
                                onChange={handleInputChange}
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
                        <Typography variant="body2" sx={subheaderSx}>
                            MY RESPONSE TO HIM
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            name="myResponse"
                            value={formData.myResponse}
                            onChange={handleInputChange}
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
                        <Typography variant="body2" sx={subheaderSx}>
                            MY TAKEAWAY FOR TODAY (Key truth in a brief phrase)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            name="takeaway"
                            value={formData.takeaway}
                            onChange={handleInputChange}
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: "1.1rem !important",
                                },
                            }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                        sx={{ mt: 2, alignSelf: "flex-start" }}
                    >
                        {loading ? "Saving..." : "Save Entry"}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
