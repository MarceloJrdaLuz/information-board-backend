"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default1694825715770 = void 0;
class default1694825715770 {
    constructor() {
        this.name = 'default1694825715770';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "image_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "imageKey" DROP NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "imageKey" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "congregation" ALTER COLUMN "image_url" SET NOT NULL`);
    }
}
exports.default1694825715770 = default1694825715770;
