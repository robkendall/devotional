import { apiFetch } from "./client";

export async function getCurrentUser() {
    try {
        const res = await apiFetch("/api/me");

        if (!res.ok) {
            return null;
        }

        const data = await res.json().catch(() => ({ user: null }));
        return data.user || null;
    } catch {
        return null;
    }
}

export async function logout() {
    const res = await apiFetch("/api/logout", {
        method: "POST",
    });

    const data = await res.json();
    return data;
}