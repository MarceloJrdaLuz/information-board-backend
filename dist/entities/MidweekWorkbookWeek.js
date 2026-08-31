"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MidweekWorkbookWeek = void 0;
const typeorm_1 = require("typeorm");
const MidweekSchedule_1 = require("./MidweekSchedule");
const MidweekWorkbookPart_1 = require("./MidweekWorkbookPart");
let MidweekWorkbookWeek = class MidweekWorkbookWeek {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MidweekWorkbookWeek.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", unique: true }),
    __metadata("design:type", String)
], MidweekWorkbookWeek.prototype, "weekDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookWeek.prototype, "weeklyBibleReading", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookWeek.prototype, "watchtowerStudyTheme", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookWeek.prototype, "songOpen", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookWeek.prototype, "songMiddle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookWeek.prototype, "songEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookWeek.prototype, "cbsSource", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MidweekWorkbookWeek.prototype, "presentations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MidweekWorkbookPart_1.MidweekWorkbookPart, part => part.workbookWeek, {
        cascade: true
    }),
    __metadata("design:type", Array)
], MidweekWorkbookWeek.prototype, "parts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MidweekSchedule_1.MidweekSchedule, schedule => schedule.workbookWeek),
    __metadata("design:type", Array)
], MidweekWorkbookWeek.prototype, "schedules", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MidweekWorkbookWeek.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MidweekWorkbookWeek.prototype, "updated_at", void 0);
MidweekWorkbookWeek = __decorate([
    (0, typeorm_1.Entity)("midweek_workbook_weeks")
], MidweekWorkbookWeek);
exports.MidweekWorkbookWeek = MidweekWorkbookWeek;
