export interface IDataCreateAnswer {
    userId: number;
    pollId: number;
    questionId: number;
    questionOptionIds: number[];
}

export interface ResultsWithNamesRaw {
    pollId: number;
    pollTitle: string;
    questionId: number;
    questionText: string;
    questionOptionId: number;
    optionText: string;
    count: string;
}

export interface ResultsWithNamesRawResponse {
    pollId: number;
    pollTitle: string;
    questionId: number;
    questionText: string;
    questionOptionId: number;
    optionText: string;
    count: number;
}