export const LogMessages = {
    auth: {
        register: {
            requestReceived: (context: string, method: string, route: string, data?: unknown) =>
                `[${context}] - [${method}] - [${route}] - Request received - [${data}]`,
            requestSuccess: (context: string, method: string, route: string, data?: unknown) =>
                `[${context}] - [${method}] - [${route}] - Request success - [${data}]`,
            registrationFailed: (context: string, method: string, route: string, error: string) =>
                `[${context}] - [${method}] - [${route}] - Registration failed for: ${error}`,
        },
        me: {
            requestSuccess: (context: string, method: string, route: string, data?: unknown) =>
                `[${context}] - [${method}] - [${route}] - Request success - [${data}]`,
        }
    }
};