import { apiFetch } from "./client";

export async function getCurrentUser() {
    const res = await apiFetch("/api/me");

    const data = await res.json();
    return data.user;
}

export async function logout() {
    const res = await apiFetch("/api/logout", {
        method: "POST",
    });

    const data = await res.json();
    return data;
}