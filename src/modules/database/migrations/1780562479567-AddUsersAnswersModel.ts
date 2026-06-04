import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersAnswersModel1780562479567 implements MigrationInterface {
    name = 'AddUsersAnswersModel1780562479567';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "users_answers" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "poll_id" integer NOT NULL, "question_id" integer NOT NULL, "option_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_22b966975e99e10732f6b3a6fce" UNIQUE ("user_id", "poll_id", "question_id", "option_id"), CONSTRAINT "PK_7d8e3c9cead04c2f06b3637d7d5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "users_answers" ADD CONSTRAINT "FK_04f756bff40e82b74726ce29c6c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "users_answers" ADD CONSTRAINT "FK_4684b42355eb4a9b4e584eb27c8" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "users_answers" ADD CONSTRAINT "FK_ac4529d4889363238c6b395a829" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "users_answers" ADD CONSTRAINT "FK_9b14b0dc92fe5695fe6356214e4" FOREIGN KEY ("option_id") REFERENCES "question_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users_answers" DROP CONSTRAINT "FK_9b14b0dc92fe5695fe6356214e4"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users_answers" DROP CONSTRAINT "FK_ac4529d4889363238c6b395a829"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users_answers" DROP CONSTRAINT "FK_4684b42355eb4a9b4e584eb27c8"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users_answers" DROP CONSTRAINT "FK_04f756bff40e82b74726ce29c6c"`,
        );
        await queryRunner.query(`DROP TABLE "users_answers"`);
    }
}
