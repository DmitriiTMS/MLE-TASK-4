import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionEntity1779805942012 implements MigrationInterface {
    name = 'AddQuestionEntity1779805942012';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "questions" ("id" SERIAL NOT NULL, "poll_id" integer NOT NULL, "text" text NOT NULL, "type" character varying(20) NOT NULL, "order_num" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "polls" DROP CONSTRAINT "FK_87fd4581faf426fcfeb4b3e4864"`,
        );
        await queryRunner.query(`ALTER TABLE "polls" ALTER COLUMN "create_user_id" DROP NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "questions" ADD CONSTRAINT "FK_4d1a4db0bc11abc1a80a167935c" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "polls" ADD CONSTRAINT "FK_87fd4581faf426fcfeb4b3e4864" FOREIGN KEY ("create_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "polls" DROP CONSTRAINT "FK_87fd4581faf426fcfeb4b3e4864"`,
        );
        await queryRunner.query(
            `ALTER TABLE "questions" DROP CONSTRAINT "FK_4d1a4db0bc11abc1a80a167935c"`,
        );
        await queryRunner.query(`ALTER TABLE "polls" ALTER COLUMN "create_user_id" SET NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "polls" ADD CONSTRAINT "FK_87fd4581faf426fcfeb4b3e4864" FOREIGN KEY ("create_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`DROP TABLE "questions"`);
    }
}
