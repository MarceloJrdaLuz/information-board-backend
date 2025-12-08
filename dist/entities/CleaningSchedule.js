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
exports.CleaningSchedule = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const CleaningGroup_1 = require("./CleaningGroup");
let CleaningSchedule = class CleaningSchedule {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CleaningSchedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], CleaningSchedule.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CleaningSchedule.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CleaningGroup_1.CleaningGroup),
    (0, typeorm_1.JoinColumn)({ name: "group_id" }),
    __metadata("design:type", CleaningGroup_1.CleaningGroup)
], CleaningSchedule.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CleaningSchedule.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], CleaningSchedule.prototype, "date", void 0);
CleaningSchedule = __decorate([
    (0, typeorm_1.Entity)("cleaning_schedule")
], CleaningSchedule);
exports.CleaningSchedule = CleaningSchedule;
