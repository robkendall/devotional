import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    CircularProgress,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { apiFetch } from "../api/client";

export default function Archive() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        fetchEntries(page + 1);
    }, [page]);

    const fetchEntries = async (pageNum) => {
        setLoading(true);
        try {
            const response = await apiFetch(`/api/entries?page=${pageNum}`);

            if (response.ok) {
                const data = await response.json();
                setEntries(data.entries);
                setTotalCount(data.totalCount);
            }
        } catch (error) {
            console.error("Error fetching entries:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleDeleteEntry = async (event, entryId) => {
        event.stopPropagation();

        const confirmed = window.confirm("Delete this entry? This cannot be undone.");
        if (!confirmed) {
            return;
        }

        setDeleteError("");
        setDeletingId(entryId);

        try {
            const response = await apiFetch(`/api/entries/${entryId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || "Failed to delete entry.");
            }

            const nextTotalCount = Math.max(totalCount - 1, 0);
            const maxPage = Math.max(0, Math.ceil(nextTotalCount / 25) - 1);
            const targetPage = Math.min(page, maxPage);

            setTotalCount(nextTotalCount);

            if (targetPage !== page) {
                setPage(targetPage);
            } else {
                await fetchEntries(targetPage + 1);
            }
        } catch (error) {
            console.error("Error deleting entry:", error);
            setDeleteError(error.message || "Failed to delete entry.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "3600px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : entries.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center" }}>
                        No entries yet.
                    </Typography>
                ) : (
                    <>
                        {deleteError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {deleteError}
                            </Alert>
                        )}

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#1a1a1a" }}>
                                        <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                                            Date
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                                            Scripture
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                                            Takeaway
                                        </TableCell>
                                        <TableCell align="right" sx={{ width: 72 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {entries.map((entry) => (
                                        <TableRow
                                            key={entry.id}
                                            hover
                                            onClick={() => navigate(`/entry/${entry.id}`)}
                                            sx={{
                                                cursor: "pointer",
                                                "& .delete-button": {
                                                    opacity: deletingId === entry.id ? 1 : 0,
                                                },
                                                "&:hover .delete-button": {
                                                    opacity: 1,
                                                },
                                            }}
                                        >
                                            <TableCell>
                                                {new Date(entry.date).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    timeZone: "UTC",
                                                })}
                                            </TableCell>
                                            <TableCell>{entry.scripture}</TableCell>
                                            <TableCell>{entry.takeaway}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    className="delete-button"
                                                    aria-label="delete entry"
                                                    onClick={(event) => handleDeleteEntry(event, entry.id)}
                                                    disabled={deletingId === entry.id}
                                                    sx={{
                                                        color: "text.secondary",
                                                        transition: "opacity 0.2s ease, color 0.2s ease, background-color 0.2s ease",
                                                        "&:hover": {
                                                            color: "error.main",
                                                            backgroundColor: "rgba(211, 47, 47, 0.08)",
                                                        },
                                                    }}
                                                >
                                                    {deletingId === entry.id ? (
                                                        <CircularProgress size={18} />
                                                    ) : (
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[25]}
                            component="div"
                            count={totalCount}
                            rowsPerPage={25}
                            page={page}
                            onPageChange={handleChangePage}
                        />
                    </>
                )}
            </Box>
        </Box>
    );
}
