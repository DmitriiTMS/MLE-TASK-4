export interface IPasswordService {
    hash(password: string): Promise<string>;
    verify(hash: string, plainPassword: string): Promise<boolean>;
}
