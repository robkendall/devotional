import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    IconButton,
    Paper,
    Snackbar,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";

const COLUMN_TYPES = ["praise", "others", "self"];
const COLUMN_LABELS = {
    praise: "Praise",
    others: "Others",
    self: "Self",
};

function getWeekStart(date) {
    const value = new Date(date);
    value.setUTCHours(0, 0, 0, 0);
    const day = value.getUTCDay();
    const diffToSunday = day;
    value.setUTCDate(value.getUTCDate() - diffToSunday);
    return value;
}

function addWeeks(date, weekOffset) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + weekOffset * 7);
    return next;
}

function toWeekKey(date) {
    return getWeekStart(date).toISOString().slice(0, 10);
}

function formatWeekLabel(date) {
    return `Week of ${getWeekStart(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    })}`;
}

function groupEntries(entries) {
    const grouped = {
        praise: [],
        others: [],
        self: [],
    };

    for (const entry of entries) {
        if (grouped[entry.entry_type]) {
            grouped[entry.entry_type].push(entry);
        }
    }

    return grouped;
}

function buildReorderPayload(groupedEntries) {
    const payload = [];

    for (const type of COLUMN_TYPES) {
        const list = groupedEntries[type] || [];
        for (let index = 0; index < list.length; index += 1) {
            payload.push({
                id: list[index].id,
                entryType: type,
                position: index,
            });
        }
    }

    return payload;
}

export default function PrayerJournal() {
    const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
    const [entriesByType, setEntriesByType] = useState({ praise: [], others: [], self: [] });
    const [inputs, setInputs] = useState({ praise: "", others: "", self: "" });
    const [loading, setLoading] = useState(true);
    const [dragging, setDragging] = useState(null);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastSeverity, setToastSeverity] = useState("success");

    const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);
    const weekKey = useMemo(() => toWeekKey(weekStart), [weekStart]);
    const previousWeekKey = useMemo(() => toWeekKey(addWeeks(weekStart, -1)), [weekStart]);
    const isCurrentWeek = weekStart.getTime() >= currentWeekStart.getTime();

    const showToast = (message, severity = "success") => {
        setToastMessage(message);
        setToastSeverity(severity);
        setToastOpen(true);
    };

    useEffect(() => {
        fetchWeekEntries(weekKey);
    }, [weekKey]);

    const fetchWeekEntries = async (requestedWeek) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/journal-entries?week=${requestedWeek}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to load journal entries");
            }

            const data = await response.json();
            setEntriesByType(groupEntries(data.entries || []));
        } catch (error) {
            console.error("Error fetching journal entries:", error);
            setEntriesByType({ praise: [], others: [], self: [] });
        } finally {
            setLoading(false);
        }
    };

    const persistReorder = async (nextGroupedEntries) => {
        const entries = buildReorderPayload(nextGroupedEntries);

        await fetch("/api/journal-entries/reorder", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ week: weekKey, entries }),
        });
    };

    const handleInputChange = (type, value) => {
        setInputs((prev) => ({ ...prev, [type]: value }));
    };

    const handleAdd = async (type) => {
        const value = (inputs[type] || "").trim();
        if (!value) return;

        try {
            const response = await fetch("/api/journal-entries", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    week: weekKey,
                    entry: value,
                    entryType: type,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to add journal entry");
            }

            const data = await response.json();
            const newEntry = data.entry;

            setEntriesByType((prev) => ({
                ...prev,
                [type]: [...prev[type], newEntry],
            }));
            setInputs((prev) => ({ ...prev, [type]: "" }));
        } catch (error) {
            console.error("Error adding journal entry:", error);
        }
    };

    const handleDelete = async (entryId) => {
        try {
            const response = await fetch(`/api/journal-entries/${entryId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to delete journal entry");
            }

            setEntriesByType((prev) => {
                const next = {
                    praise: prev.praise.filter((item) => item.id !== entryId),
                    others: prev.others.filter((item) => item.id !== entryId),
                    self: prev.self.filter((item) => item.id !== entryId),
                };

                persistReorder(next).catch((error) => {
                    console.error("Error syncing reorder after delete:", error);
                });

                return next;
            });
        } catch (error) {
            console.error("Error deleting journal entry:", error);
        }
    };

    const handleDropOnColumn = (targetType) => {
        if (!dragging) return;

        const { sourceType, entryId } = dragging;

        setEntriesByType((prev) => {
            const sourceList = [...prev[sourceType]];
            const targetList = sourceType === targetType ? sourceList : [...prev[targetType]];
            const movingIndex = sourceList.findIndex((item) => item.id === entryId);

            if (movingIndex < 0) return prev;

            const [movingEntry] = sourceList.splice(movingIndex, 1);
            movingEntry.entry_type = targetType;
            targetList.push(movingEntry);

            const next = {
                ...prev,
                [sourceType]: sourceList,
                [targetType]: targetList,
            };

            persistReorder(next).catch((error) => {
                console.error("Error persisting drop reorder:", error);
            });

            return next;
        });

        setDragging(null);
    };

    const handleDropOnItem = (targetType, targetId) => {
        if (!dragging) return;

        const { sourceType, entryId } = dragging;

        setEntriesByType((prev) => {
            const sourceList = [...prev[sourceType]];
            const targetList = sourceType === targetType ? sourceList : [...prev[targetType]];

            const movingIndex = sourceList.findIndex((item) => item.id === entryId);
            const targetIndex = targetList.findIndex((item) => item.id === targetId);

            if (movingIndex < 0 || targetIndex < 0) return prev;

            const [movingEntry] = sourceList.splice(movingIndex, 1);
            movingEntry.entry_type = targetType;

            const adjustedTargetIndex =
                sourceType === targetType && movingIndex < targetIndex ? targetIndex - 1 : targetIndex;
            targetList.splice(adjustedTargetIndex, 0, movingEntry);

            const next = {
                ...prev,
                [sourceType]: sourceList,
                [targetType]: targetList,
            };

            persistReorder(next).catch((error) => {
                console.error("Error persisting item reorder:", error);
            });

            return next;
        });

        setDragging(null);
    };

    const handleCopyPreviousWeek = async () => {
        try {
            const response = await fetch("/api/journal-entries/copy-previous-week", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ week: weekKey, previousWeek: previousWeekKey }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                console.error(data.error || "Failed to copy previous week entries");
                showToast(data.error || "Failed to copy previous week entries", "error");
                return;
            }

            const copiedCount = Number(data.copied || 0);
            showToast(`Copied ${copiedCount} entries`, "success");
            fetchWeekEntries(weekKey);
        } catch (error) {
            console.error("Error copying previous week entries:", error);
            showToast("Failed to copy previous week entries", "error");
        }
    };

    const hasAnyCurrentEntries =
        entriesByType.praise.length > 0 || entriesByType.others.length > 0 || entriesByType.self.length > 0;

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "1400px", width: { xs: "100%", md: "90%" }, mx: "auto", px: 2 }}>
                <Paper sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                        <IconButton
                            aria-label="Previous week"
                            onClick={() => setWeekStart((prev) => addWeeks(prev, -1))}
                            size="small"
                        >
                            <ArrowBackIcon />
                        </IconButton>

                        <Box sx={{ textAlign: "center" }}>
                            <Typography variant="h6">{formatWeekLabel(weekStart)}</Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleCopyPreviousWeek}
                                sx={{ mt: 0.5 }}
                                disabled={hasAnyCurrentEntries}
                            >
                                Copy Last Week
                            </Button>
                        </Box>

                        <IconButton
                            aria-label="Next week"
                            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
                            size="small"
                            disabled={isCurrentWeek}
                        >
                            <ArrowForwardIcon />
                        </IconButton>
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={0} divider={null}>
                        {COLUMN_TYPES.map((type, columnIndex) => (
                            <Box
                                key={type}
                                sx={{
                                    flex: 1,
                                    px: { xs: 0, md: 2 },
                                    py: 1,
                                    borderRight: {
                                        xs: "none",
                                        md: columnIndex < COLUMN_TYPES.length - 1 ? "1px solid" : "none",
                                    },
                                    borderColor: "divider",
                                    minHeight: 500,
                                }}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => handleDropOnColumn(type)}
                            >
                                <Typography variant="h6" sx={{ mb: 1.5 }}>
                                    {COLUMN_LABELS[type]}
                                </Typography>

                                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        value={inputs[type]}
                                        onChange={(event) => handleInputChange(type, event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                event.preventDefault();
                                                handleAdd(type);
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleAdd(type)}
                                        sx={{ minWidth: 36, px: 0.5 }}
                                    >
                                        <CheckIcon fontSize="small" />
                                    </Button>
                                </Stack>

                                {loading ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Loading...
                                    </Typography>
                                ) : (
                                    <Stack spacing={1.25}>
                                        {entriesByType[type].map((item) => (
                                            <Paper
                                                key={item.id}
                                                draggable
                                                onDragStart={() => setDragging({ sourceType: type, entryId: item.id })}
                                                onDragEnd={() => setDragging(null)}
                                                onDragOver={(event) => event.preventDefault()}
                                                onDrop={(event) => {
                                                    event.stopPropagation();
                                                    handleDropOnItem(type, item.id);
                                                }}
                                                sx={{
                                                    px: 1,
                                                    py: 0.75,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: 1,
                                                    cursor: "grab",
                                                    "&:active": { cursor: "grabbing" },
                                                    "&:hover .delete-action": { opacity: 1 },
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                    {item.entry}
                                                </Typography>
                                                <Tooltip title="Remove">
                                                    <IconButton
                                                        size="small"
                                                        className="delete-action"
                                                        onClick={() => handleDelete(item.id)}
                                                        sx={{
                                                            opacity: 0,
                                                            transition: "opacity 120ms ease",
                                                            color: "error.main",
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Paper>
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        ))}
                    </Stack>
                </Paper>

                <Snackbar
                    open={toastOpen}
                    autoHideDuration={2500}
                    onClose={() => setToastOpen(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setToastOpen(false)}
                        severity={toastSeverity}
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        {toastMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );
}
