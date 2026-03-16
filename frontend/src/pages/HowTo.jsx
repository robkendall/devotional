import { Box, Button, Divider, List, ListItem, Paper, Typography } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

const bulletSx = { display: "list-item", listStyleType: "disc", ml: 3, pl: 0.5, pb: 0.5 };
const subBulletSx = { display: "list-item", listStyleType: "circle", ml: 5, pl: 0.5, pb: 0.5 };

export default function HowTo() {
    const navigate = useNavigate();

    useEffect(() => {
        apiFetch("/api/me/seen-how-to", {
            method: "POST",
        }).catch((error) => {
            console.error("Failed to update how-to viewed flag:", error);
        });
    }, []);

    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4, minHeight: "100vh", width: "100%", pt: 10 }}>
            <Box sx={{ maxWidth: "1200px", width: { xs: "100%", md: "80%" }, mx: "auto", px: 2 }}>
                <Paper sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                        How to use Reading and Reflecting
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        To help you recall the basics involved in the Reading &amp; Reflecting Journal, we've created a "Quick Reference
                        Guide" for you to keep handy — just in case you can't quite remember what a specific step involves.
                    </Typography>

                    <List disablePadding>
                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1">Date</Typography>
                        </ListItem>

                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1">Scripture (generally 7–10 verses)</Typography>
                        </ListItem>
                        <List disablePadding>
                            <ListItem disableGutters sx={subBulletSx}>
                                <Typography variant="body1">For observation</Typography>
                            </ListItem>
                            <ListItem disableGutters sx={subBulletSx}>
                                <Typography variant="body1">For engagement</Typography>
                            </ListItem>
                        </List>

                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1">Prayer ("Speak, Lord, for your servant is listening")</Typography>
                        </ListItem>
                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1">Read passage aloud</Typography>
                        </ListItem>
                    </List>

                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        This first reading is primarily for prayerful observation. Here, ask, "What is this passage about? What did it mean
                        to its first hearers?"
                    </Typography>

                    <List disablePadding>
                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1">Read the passage aloud, again</Typography>
                        </ListItem>
                    </List>

                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        In this reading, you ask, "What is the message that the Spirit of God has for us about God in this passage? What
                        does He say about all of us humans or all of us believers? What might God be saying to me in this passage?" This
                        second reading is more personal and reflective.
                    </Typography>

                    <List disablePadding>
                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1">Key verse or phrase for today</Typography>
                        </ListItem>
                        <List disablePadding>
                            <ListItem disableGutters sx={subBulletSx}>
                                <Typography variant="body1">Ask the Lord to speak to you, giving you one verse/word you need to hear and apply.</Typography>
                            </ListItem>
                            <ListItem disableGutters sx={subBulletSx}>
                                <Typography variant="body1">Write the whole verse/phrase down.</Typography>
                            </ListItem>
                            <ListItem disableGutters sx={subBulletSx}>
                                <Typography variant="body1">Be sensitive, especially to those passages where you sense personal conviction or discomfort.</Typography>
                            </ListItem>
                        </List>

                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1">
                                This is a… <Typography component="span" color="text.secondary">(Check any that apply)</Typography>
                            </Typography>
                        </ListItem>
                    </List>

                    <Typography variant="body2" color="text.secondary" sx={{ ml: 3, mb: 2 }}>
                        Principle to live by | Sin to forsake | Hope to celebrate | Example to follow |
                        Insight about the church to apply | Command to obey | Error to avoid | Promise to claim | Perspective to adopt
                    </Typography>

                    <List disablePadding>
                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1" fontWeight="medium">Reflect</Typography>
                        </ListItem>
                    </List>

                    <Typography variant="body1" sx={{ ml: 3, mt: 0.5, mb: 0.5 }}>What God shows us about himself</Typography>
                    <List disablePadding>
                        <ListItem disableGutters sx={subBulletSx}>
                            <Typography variant="body1" color="text.secondary">
                                Ask, "What does this passage show us about God that we could not know if He had not revealed it to us
                                through His Word?"
                            </Typography>
                        </ListItem>
                    </List>

                    <Typography variant="body1" sx={{ ml: 3, mt: 1, mb: 0.5 }}>What God shows us about us</Typography>
                    <List disablePadding>
                        <ListItem disableGutters sx={subBulletSx}>
                            <Typography variant="body1" color="text.secondary">
                                Ask, "What is God saying here to all of us regardless of time or place? All of us humans? All of us believers?"
                            </Typography>
                        </ListItem>
                    </List>

                    <Typography variant="body1" sx={{ ml: 3, mt: 1, mb: 0.5 }}>What God told me personally</Typography>
                    <List disablePadding>
                        <ListItem disableGutters sx={subBulletSx}>
                            <Typography variant="body1" color="text.secondary">Record this as if God is speaking directly to you.</Typography>
                        </ListItem>
                        <ListItem disableGutters sx={subBulletSx}>
                            <Typography variant="body1" color="text.secondary">
                                What is God saying here to me about me — who I am, where I am in my life, what I am doing, and what I am choosing?
                            </Typography>
                        </ListItem>
                        <ListItem disableGutters sx={subBulletSx}>
                            <Typography variant="body1" color="text.secondary">
                                Look for what He is saying to you in this passage to teach, convict, correct, or encourage you in
                                righteousness (2 Tim. 3:16).
                            </Typography>
                        </ListItem>
                    </List>

                    <List disablePadding sx={{ mt: 1 }}>
                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1" fontWeight="medium">Respond</Typography>
                        </ListItem>
                    </List>

                    <Typography variant="body1" sx={{ ml: 3, mt: 0.5, mb: 0.5 }}>My response to him</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ ml: 3, mb: 1 }}>
                        Write a prayer, responding to what God has said to you through His Word.
                    </Typography>
                    <List disablePadding>
                        <ListItem disableGutters sx={subBulletSx}>
                            <Typography variant="body1" color="text.secondary">
                                Offer thanks, confession of sin, or an affirmation of a principle He has shown (etc.).
                            </Typography>
                        </ListItem>
                        <ListItem disableGutters sx={subBulletSx}>
                            <Typography variant="body1" color="text.secondary">
                                Always include a commitment to live according to the truth He has revealed and the word He has given you personally.
                            </Typography>
                        </ListItem>
                    </List>

                    <List disablePadding sx={{ mt: 1 }}>
                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1" fontWeight="medium">Commit</Typography>
                        </ListItem>
                        <ListItem disableGutters sx={bulletSx}>
                            <Typography variant="body1">My take away for today (key truth in a brief phrase)</Typography>
                        </ListItem>
                    </List>

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="h6" sx={{ mb: 1 }}>
                        See it in action
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Open a completed example entry to see what a finished devotional looks like before writing your own.
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => navigate("/new?example=true")}
                    >
                        View Example Entry
                    </Button>
                </Paper>
            </Box>
        </Box>
    );
}
