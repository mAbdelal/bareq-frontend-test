const fetchWithAuth = async (url, options = {}) => {
    const res = await fetch(url, {
        ...options,
        credentials: "include",
    });

    if (res.status === 401) {
        const refresh = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/refresh-token`, {
            method: "POST",
            credentials: "include",
        });
        if (!refresh.ok) throw new Error("Session expired");

        return fetch(url, { ...options, credentials: "include" });
    }
    return res;
};

export default fetchWithAuth;