// undefined → initial state(we haven’t checked cookies / localStorage yet).
// null → checked and confirmed that no user is logged in.
// object(user data) → checked and found a logged -in user.

export const initialUserState = {
    user: undefined,
};

export function userReducer(state, action) {
    switch (action.type) {
        case "LOGIN":
            return { ...state, user: action.payload };
        case "LOGOUT":
            return { ...state, user: null };
        case "UPDATE":
            return { ...state, user: { ...state.user, ...action.payload } };
        default:
            return state;
    }
}