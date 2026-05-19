export interface PollResponse {
    id: number;
    title: string;
    description: string | undefined;
    isActive: boolean;
    createUser: {
        id: number;
        name: string;
    };
}

export interface PaginatedResponse {
    data: PollResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
