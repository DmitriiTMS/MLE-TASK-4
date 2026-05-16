import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPollEntity1778933169439 implements MigrationInterface {
    name = 'AddPollEntity1778933169439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "polls" ("id" SERIAL NOT NULL, "create_user_id" integer NOT NULL, "title" character varying(255) NOT NULL, "description" character varying(3000), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b9bbb8fc7b142553c518ddffbb6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "polls" ADD CONSTRAINT "FK_87fd4581faf426fcfeb4b3e4864" FOREIGN KEY ("create_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "polls" DROP CONSTRAINT "FK_87fd4581faf426fcfeb4b3e4864"`);
        await queryRunner.query(`DROP TABLE "polls"`);
    }

}
