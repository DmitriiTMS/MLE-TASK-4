export const LogMessages = {
    auth: {
        register: {
            requestReceived: (context: string, method: string, route: string, data?: unknown) =>
                `[${context}] - [${method}] - [${route}] - Request received register - [${data}]`,
            requestSuccess: (context: string, method: string, route: string, data?: unknown) =>
                `[${context}] - [${method}] - [${route}] - Request success register - [${data}]`,
            registrationFailed: (context: string, method: string, route: string, error: string) =>
                `[${context}] - [${method}] - [${route}] - Registration failed for: ${error}`,
        },

        login: {
            requestReceived: (context: string, method: string, route: string, data?: unknown) =>
                `[${context}] - [${method}] - [${route}] - Request received login - [${data}]`,
            requestSuccess: (context: string, method: string, route: string, data?: unknown) =>
                `[${context}] - [${method}] - [${route}] - Request success login - [${data}]`,
            loginFailed: (context: string, method: string, route: string, error: string) =>
                `[${context}] - [${method}] - [${route}] - Login failed for: ${error}`,
        },
        me: {
            requestSuccess: (context: string, method: string, route: string, data?: unknown) =>
                `[${context}] - [${method}] - [${route}] - Request success - [${data}]`,
        },
        refresh: {
            requestReceived: (context: string, method: string, route: string) =>
                `[${context}] - [${method}] ${route} - Refresh request received`,
            requestSuccess: (context: string, method: string, route: string) =>
                `[${context}] - [${method}] ${route} - Tokens refreshed successfully`,
            tokenNotFound: (context: string, method: string, route: string) =>
                `[${context}] - [${method}] ${route} - Refresh token not found in cookies`,
            refreshFailed: (context: string, method: string, route: string, error: string) =>
                `[${context}] - [${method}] ${route} - Refresh failed: ${error}`,
        },
    },
};
