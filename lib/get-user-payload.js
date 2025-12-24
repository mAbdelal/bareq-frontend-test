export default function getUserPayload() {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {});

    return cookies.userPayload ? JSON.parse(cookies.userPayload) : null;
}

