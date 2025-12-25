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
exports.FieldServiceTemplate = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const Publisher_1 = require("./Publisher");
const FieldServiceRotationMember_1 = require("./FieldServiceRotationMember");
let FieldServiceTemplate = class FieldServiceTemplate {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], FieldServiceTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], FieldServiceTemplate.prototype, "congregation_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "congregation_id" }),
    __metadata("design:type", Congregation_1.Congregation)
], FieldServiceTemplate.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["FIXED", "ROTATION"],
    }),
    __metadata("design:type", String)
], FieldServiceTemplate.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], FieldServiceTemplate.prototype, "weekday", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "time" }),
    __metadata("design:type", String)
], FieldServiceTemplate.prototype, "time", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FieldServiceTemplate.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], FieldServiceTemplate.prototype, "leader_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "leader_id" }),
    __metadata("design:type", Object)
], FieldServiceTemplate.prototype, "leader", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], FieldServiceTemplate.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FieldServiceRotationMember_1.FieldServiceRotationMember, r => r.template, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], FieldServiceTemplate.prototype, "rotation_members", void 0);
FieldServiceTemplate = __decorate([
    (0, typeorm_1.Entity)("field_service_templates")
], FieldServiceTemplate);
exports.FieldServiceTemplate = FieldServiceTemplate;
