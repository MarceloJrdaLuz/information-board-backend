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
exports.TotalsReports = void 0;
const typeorm_1 = require("typeorm");
const enumWeekDays_1 = require("../types/enumWeekDays");
const Congregation_1 = require("./Congregation");
let TotalsReports = class TotalsReports {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TotalsReports.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enumWeekDays_1.Months }),
    __metadata("design:type", String)
], TotalsReports.prototype, "month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], TotalsReports.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], TotalsReports.prototype, "publishersActives", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", String)
], TotalsReports.prototype, "privileges", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, congregation => congregation.id, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: 'congregation_id' }),
    __metadata("design:type", Congregation_1.Congregation)
], TotalsReports.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" || 'string' }),
    __metadata("design:type", Number)
], TotalsReports.prototype, "hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], TotalsReports.prototype, "studies", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", Number)
], TotalsReports.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TotalsReports.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TotalsReports.prototype, "updated_at", void 0);
TotalsReports = __decorate([
    (0, typeorm_1.Entity)('totals')
], TotalsReports);
exports.TotalsReports = TotalsReports;
