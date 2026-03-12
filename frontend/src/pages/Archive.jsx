import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
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

export default function Archive() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEntries(page + 1);
    }, [page]);

    const fetchEntries = async (pageNum) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/entries?page=${pageNum}`, {
                credentials: "include",
            });

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
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {entries.map((entry) => (
                                        <TableRow
                                            key={entry.id}
                                            hover
                                            onClick={() => navigate(`/entry/${entry.id}`)}
                                            sx={{ cursor: "pointer" }}
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
