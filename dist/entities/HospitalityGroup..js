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
exports.HospitalityGroup = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const Publisher_1 = require("./Publisher");
let HospitalityGroup = class HospitalityGroup {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], HospitalityGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], HospitalityGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation
    // Anfitrião
    )
], HospitalityGroup.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { onDelete: "SET NULL", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Object)
], HospitalityGroup.prototype, "host", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Object)
], HospitalityGroup.prototype, "next_reception", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], HospitalityGroup.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Publisher_1.Publisher, publisher => publisher.hospitalityGroup),
    __metadata("design:type", Array)
], HospitalityGroup.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HospitalityGroup.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HospitalityGroup.prototype, "updated_at", void 0);
HospitalityGroup = __decorate([
    (0, typeorm_1.Entity)("hospitality_group"),
    (0, typeorm_1.Unique)(["congregation", "name"])
], HospitalityGroup);
exports.HospitalityGroup = HospitalityGroup;
