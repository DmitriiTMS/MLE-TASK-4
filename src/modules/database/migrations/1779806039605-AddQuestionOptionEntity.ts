import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionOptionEntity1779806039605 implements MigrationInterface {
    name = 'AddQuestionOptionEntity1779806039605';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "question_options" ("id" SERIAL NOT NULL, "question_id" integer NOT NULL, "text" character varying(255) NOT NULL, "order_num" integer NOT NULL, CONSTRAINT "PK_13be20e51c0738def32f00cf7d5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "question_options" ADD CONSTRAINT "FK_f0b7aaabd3f88e700daf0fe681c" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "question_options" DROP CONSTRAINT "FK_f0b7aaabd3f88e700daf0fe681c"`,
        );
        await queryRunner.query(`DROP TABLE "question_options"`);
    }
}
