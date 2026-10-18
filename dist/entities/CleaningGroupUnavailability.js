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
exports.CleaningGroupUnavailability = void 0;
const typeorm_1 = require("typeorm");
const CleaningGroup_1 = require("./CleaningGroup");
const Congregation_1 = require("./Congregation");
let CleaningGroupUnavailability = class CleaningGroupUnavailability {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CleaningGroupUnavailability.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], CleaningGroupUnavailability.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CleaningGroupUnavailability.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CleaningGroup_1.CleaningGroup, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "group_id" }),
    __metadata("design:type", CleaningGroup_1.CleaningGroup)
], CleaningGroupUnavailability.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CleaningGroupUnavailability.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], CleaningGroupUnavailability.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], CleaningGroupUnavailability.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], CleaningGroupUnavailability.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CleaningGroupUnavailability.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CleaningGroupUnavailability.prototype, "updated_at", void 0);
CleaningGroupUnavailability = __decorate([
    (0, typeorm_1.Entity)("cleaning_group_unavailabilities")
], CleaningGroupUnavailability);
exports.CleaningGroupUnavailability = CleaningGroupUnavailability;
