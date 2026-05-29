export interface ICreateOptioData {
    userId: number;
    questionId: number;
    createOptionDto: {
        text: string;
        orderNum: number;
    };
}

export interface ICreateOptionResponseData {
    id: number
    text: string
    orderNum: number
}
