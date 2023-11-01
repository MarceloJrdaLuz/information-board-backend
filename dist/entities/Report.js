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
exports.Report = void 0;
const typeorm_1 = require("typeorm");
const Publisher_1 = require("./Publisher");
const enumWeekDays_1 = require("../types/enumWeekDays");
let Report = class Report {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Report.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enumWeekDays_1.Months }),
    __metadata("design:type", String)
], Report.prototype, "month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Report.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Report.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, publisher => publisher.id, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: 'publisher_id' }),
    __metadata("design:type", Publisher_1.Publisher)
], Report.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" || 'string' }),
    __metadata("design:type", Number)
], Report.prototype, "hours", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], Report.prototype, "studies", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Report.prototype, "observations", void 0);
Report = __decorate([
    (0, typeorm_1.Entity)('reports')
], Report);
exports.Report = Report;
