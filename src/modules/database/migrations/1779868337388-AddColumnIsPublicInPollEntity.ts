import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnIsPublicInPollEntity1779868337388 implements MigrationInterface {
    name = 'AddColumnIsPublicInPollEntity1779868337388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "polls" ADD "is_public" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "polls" DROP COLUMN "is_public"`);
    }

}
