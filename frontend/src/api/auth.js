export async function getCurrentUser() {
    const res = await fetch("/api/me", {
        credentials: "include"
    });

    const data = await res.json();
    return data.user;
}

export async function logout() {
    const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
    });

    const data = await res.json();
    return data;
}