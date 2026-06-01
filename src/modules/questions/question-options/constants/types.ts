export interface ICreateOptioData {
    userId: number;
    questionId: number;
    createOptionDto: {
        text: string;
        orderNum: number;
    };
}

export interface IDeleteOptionData {
    userId: number;
    questionId: number;
    optionId: number;
}

export interface ICreateOptionResponseData {
    id: number;
    text: string;
    orderNum: number;
}
