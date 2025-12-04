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
exports.CleaningScheduleConfig = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const cleaning_1 = require("../types/cleaning");
let CleaningScheduleConfig = class CleaningScheduleConfig {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CleaningScheduleConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Congregation_1.Congregation)
], CleaningScheduleConfig.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: cleaning_1.CleaningScheduleMode,
        default: cleaning_1.CleaningScheduleMode.WEEKLY
    }),
    __metadata("design:type", String)
], CleaningScheduleConfig.prototype, "mode", void 0);
CleaningScheduleConfig = __decorate([
    (0, typeorm_1.Entity)("cleaning_schedule_config")
], CleaningScheduleConfig);
exports.CleaningScheduleConfig = CleaningScheduleConfig;
