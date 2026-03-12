import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth";

export default function RequireAuth({ children }) {
    const [user, setUser] = useState(undefined);

    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    if (user === undefined) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}