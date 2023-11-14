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
exports.MeetingAssistance = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const enumWeekDays_1 = require("../types/enumWeekDays");
let MeetingAssistance = class MeetingAssistance {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MeetingAssistance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enumWeekDays_1.Months }),
    __metadata("design:type", String)
], MeetingAssistance.prototype, "month", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], MeetingAssistance.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array' }),
    __metadata("design:type", Array)
], MeetingAssistance.prototype, "midWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MeetingAssistance.prototype, "midWeekTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MeetingAssistance.prototype, "midWeekAverage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array' }),
    __metadata("design:type", Array)
], MeetingAssistance.prototype, "endWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MeetingAssistance.prototype, "endWeekTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MeetingAssistance.prototype, "endWeekAverage", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, congregation => congregation.id, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: 'congregation_id' }),
    __metadata("design:type", Congregation_1.Congregation)
], MeetingAssistance.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MeetingAssistance.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MeetingAssistance.prototype, "updated_at", void 0);
MeetingAssistance = __decorate([
    (0, typeorm_1.Entity)('assistance')
], MeetingAssistance);
exports.MeetingAssistance = MeetingAssistance;
