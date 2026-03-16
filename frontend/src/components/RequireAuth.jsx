import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth";

export default function RequireAuth({ children }) {
    const [user, setUser] = useState(undefined);

    useEffect(() => {
        let active = true;

        getCurrentUser()
            .then((resolvedUser) => {
                if (!active) return;
                setUser(resolvedUser);
            })
            .catch(() => {
                if (!active) return;
                setUser(null);
            });

        return () => {
            active = false;
        };
    }, []);

    if (user === undefined) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}