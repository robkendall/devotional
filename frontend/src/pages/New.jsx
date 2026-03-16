import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Divider,
    FormControlLabel,
    Grid,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { apiFetch } from "../api/client";

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

const EXAMPLE_ENTRY = {
    scripture: "Matthew 6:19-24",
    prayRead: "22 \"The eye is the lamp of the body. So, if your eye is healthy, your whole body will be full of light, 23 but if your eye is bad, your whole body will be full of darkness. If then the light in you is darkness, how great is the darkness!",
    prrCheckboxes: [true, true, true],
    reflectionTypes: REFLECTION_TYPES.map((_, idx) => idx === 8),
    godAboutHimself: "God is one who cares about what we see. He cares about what we see and how we see the world because he loves us. When our eyes are healthy, the things we see and our perspective, our whole body will be full of light and we will be like Him.",
    godAboutUs: "We have two paths in life - to see the light and walk in it or be blinded and walk in darkness. What we see and how we see impacts everything about us. Vision is a symbol of our spiritual health.",
    godToldMePersonally: "I sense that God is telling me to evaluate what I spend my time watching. I also believe God is telling me to change my perspective on a few key relationships and to see these people like Jesus sees them.",
    myResponse: "God, thank you for showing me your Son and allowing me to see, I pray that I make Jesus the center of my sight everyday. I pray you make it clear what you want me to stop watching and how you want me to see my key relationships differently. In Jesus name, amen.",
    takeaway: "What I see determines who I am becoming. I will speak with my DMG about some of the ways I want them to hold me accountable to what I see and how I see the world.",
};

const subheaderSx = {
    display: "block",
    mb: 2,
    color: "text.secondary",
};

function createInitialFormData() {
    return {
        scripture: "",
        prayRead: "",
        prrCheckboxes: [false, false, false],
        reflectionTypes: REFLECTION_TYPES.map(() => false),
        godAboutHimself: "",
        godAboutUs: "",
        godToldMePersonally: "",
        myResponse: "",
        takeaway: "",
    };
}

function getMissingFields(formData) {
    const missing = {};

    [
        "scripture",
        "prayRead",
        "godAboutHimself",
        "godAboutUs",
        "godToldMePersonally",
        "myResponse",
        "takeaway",
    ].forEach((field) => {
        if (!String(formData[field] || "").trim()) {
            missing[field] = true;
        }
    });

    if (!formData.prrCheckboxes.every(Boolean)) {
        missing.prrCheckboxes = true;
    }

    if (!formData.reflectionTypes.some(Boolean)) {
        missing.reflectionTypes = true;
    }

    return missing;
}

export default function New() {
    const navigate = useNavigate();
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
    const isoDate = today.toISOString().split("T")[0];

    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState(createInitialFormData());
    const [loading, setLoading] = useState(false);
    const [exampleMode, setExampleMode] = useState(false);
    const [previousScripture, setPreviousScripture] = useState("");
    const [loadingPrevious, setLoadingPrevious] = useState(true);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [missingFields, setMissingFields] = useState({});
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        const isExample = searchParams.get("example") === "true";

        if (isExample) {
            setFormData({
                ...EXAMPLE_ENTRY,
                prrCheckboxes: [...EXAMPLE_ENTRY.prrCheckboxes],
                reflectionTypes: [...EXAMPLE_ENTRY.reflectionTypes],
            });
            setExampleMode(true);
            return;
        }

        setFormData(createInitialFormData());
        setExampleMode(false);
        setAttemptedSubmit(false);
        setMissingFields({});
        setSubmitError("");
    }, [searchParams]);

    useEffect(() => {
        const fetchPreviousScripture = async () => {
            try {
                const response = await apiFetch(`/api/entries/previous?date=${isoDate}`);

                if (!response.ok) {
                    return;
                }

                const result = await response.json();
                setPreviousScripture(result.scripture || "");
            } catch (error) {
                console.error("Error fetching previous scripture:", error);
            } finally {
                setLoadingPrevious(false);
            }
        };

        fetchPreviousScripture();
    }, [isoDate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const nextData = {
            ...formData,
            [name]: value,
        };

        setFormData(nextData);

        if (attemptedSubmit) {
            setMissingFields(getMissingFields(nextData));
        }
    };

    const handleCheckboxChange = (index, field) => {
        const updated = [...formData[field]];
        updated[index] = !updated[index];

        const nextData = {
            ...formData,
            [field]: updated,
        };

        setFormData(nextData);

        if (attemptedSubmit) {
            setMissingFields(getMissingFields(nextData));
        }
    };

    const saveEntry = async () => {
        const submissionData = {
            ...formData,
            date: isoDate,
        };

        try {
            const response = await apiFetch("/api/entry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionData),
            });

            if (response.ok) {
                return { ok: true };
            }

            const payload = await response.json().catch(() => ({}));
            console.error("Failed to save entry:", response.status, payload);
            return {
                ok: false,
                message: payload.error || "Failed to save entry.",
            };
        } catch (error) {
            console.error("Error submitting form:", error);
            return { ok: false, message: "Error submitting form." };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setAttemptedSubmit(true);
        const nextMissingFields = getMissingFields(formData);
        setMissingFields(nextMissingFields);

        if (Object.keys(nextMissingFields).length > 0) {
            setSubmitError("Please fill in all required sections before saving.");
            return;
        }

        setSubmitError("");
        setLoading(true);

        const result = await saveEntry();

        setLoading(false);

        if (result.ok) {
            navigate("/archive");
            return;
        }

        setSubmitError(result.message || "Failed to save entry.");
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Typography variant="h4" sx={{ textAlign: "center", color: "text.secondary", mb: 4 }}>
                    {exampleMode ? `Example — ${formattedDate}` : formattedDate}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Box>
                        <Grid container spacing={2} alignItems="flex-start">
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    name="scripture"
                                    label="Scripture Reference"
                                    placeholder="e.g., John 1:1-2"
                                    value={formData.scripture}
                                    onChange={handleInputChange}
                                    error={attemptedSubmit && Boolean(missingFields.scripture)}
                                    helperText={attemptedSubmit && missingFields.scripture ? "Required" : ""}
                                    InputProps={{ readOnly: exampleMode }}
                                />
                            </Grid>
                            {!exampleMode && (previousScripture || loadingPrevious) && (
                                <Grid item xs={12} md={4}>
                                    <Typography variant="body2" sx={{ mt: { xs: 0, md: 1.5 }, color: "text.secondary" }}>
                                        {loadingPrevious
                                            ? "Previous: loading..."
                                            : `Previous: ${previousScripture}`}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>

                    </Box>

                    <Divider />

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
                                                disabled={exampleMode}
                                            />
                                        }
                                        label={label.replace("P", "Pray").replace("R", "Read")}
                                    />
                                ))}
                            </Stack>
                        </Box>
                        {attemptedSubmit && missingFields.prrCheckboxes && (
                            <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
                                Required: check all PRAY & READ boxes.
                            </Typography>
                        )}
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
                            error={attemptedSubmit && Boolean(missingFields.prayRead)}
                            helperText={attemptedSubmit && missingFields.prayRead ? "Required" : ""}
                            InputProps={{ readOnly: exampleMode }}
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: "1.1rem",
                                },
                            }}
                        />
                    </Box>

                    <Divider />

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
                                            disabled={exampleMode}
                                        />
                                    }
                                    label={type}
                                />
                            ))}
                        </Stack>
                        {attemptedSubmit && missingFields.reflectionTypes && (
                            <Typography variant="body2" color="error.main">
                                Required: choose at least one.
                            </Typography>
                        )}
                    </Box>

                    <Divider />

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
                                error={attemptedSubmit && Boolean(missingFields.godAboutHimself)}
                                helperText={attemptedSubmit && missingFields.godAboutHimself ? "Required" : ""}
                                InputProps={{ readOnly: exampleMode }}
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
                                error={attemptedSubmit && Boolean(missingFields.godAboutUs)}
                                helperText={attemptedSubmit && missingFields.godAboutUs ? "Required" : ""}
                                InputProps={{ readOnly: exampleMode }}
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
                                error={attemptedSubmit && Boolean(missingFields.godToldMePersonally)}
                                helperText={attemptedSubmit && missingFields.godToldMePersonally ? "Required" : ""}
                                InputProps={{ readOnly: exampleMode }}
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "1.1rem",
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider />

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
                            error={attemptedSubmit && Boolean(missingFields.myResponse)}
                            helperText={attemptedSubmit && missingFields.myResponse ? "Required" : ""}
                            InputProps={{ readOnly: exampleMode }}
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: "1.1rem",
                                },
                            }}
                        />
                    </Box>

                    <Divider />

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
                            error={attemptedSubmit && Boolean(missingFields.takeaway)}
                            helperText={attemptedSubmit && missingFields.takeaway ? "Required" : ""}
                            InputProps={{ readOnly: exampleMode }}
                            sx={{
                                "& .MuiInputBase-input": {
                                    fontSize: "1.1rem !important",
                                },
                            }}
                        />
                    </Box>

                    {submitError && <Alert severity="warning">{submitError}</Alert>}

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading || exampleMode}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                        sx={{ mt: 2, alignSelf: "flex-start" }}
                    >
                        {exampleMode ? "Example Mode" : loading ? "Saving..." : "Save Entry"}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
