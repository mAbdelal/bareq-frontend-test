"use client";

import { createContext, useContext, useReducer, useEffect } from "react";
import Cookies from "js-cookie";
import { userReducer, initialUserState } from "./userReducer";

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [state, dispatch] = useReducer(userReducer, initialUserState);

    useEffect(() => {
        const cookiePayload = Cookies.get("userPayload");
        if (cookiePayload) {
            try {
                const parsed = JSON.parse(cookiePayload);
                dispatch({ type: "LOGIN", payload: parsed });
            } catch (err) {
                dispatch({ type: "LOGOUT" });
            }
        } else {
            dispatch({ type: "LOGOUT" });
        }
    }, []);

    return (
        <UserContext.Provider value={{ state, dispatch }}>
            {children}
        </UserContext.Provider>
    );
}


export function useUser() {
    return useContext(UserContext);
}













