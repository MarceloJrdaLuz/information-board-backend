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
exports.FieldServiceRotationMember = void 0;
const typeorm_1 = require("typeorm");
const FieldServiceTemplate_1 = require("./FieldServiceTemplate");
const Publisher_1 = require("./Publisher");
let FieldServiceRotationMember = class FieldServiceRotationMember {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], FieldServiceRotationMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FieldServiceTemplate_1.FieldServiceTemplate, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "template_id" }),
    __metadata("design:type", FieldServiceTemplate_1.FieldServiceTemplate)
], FieldServiceRotationMember.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], FieldServiceRotationMember.prototype, "publisher_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Publisher_1.Publisher),
    (0, typeorm_1.JoinColumn)({ name: "publisher_id" }),
    __metadata("design:type", Publisher_1.Publisher)
], FieldServiceRotationMember.prototype, "publisher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], FieldServiceRotationMember.prototype, "order", void 0);
FieldServiceRotationMember = __decorate([
    (0, typeorm_1.Entity)("field_service_rotation_members")
], FieldServiceRotationMember);
exports.FieldServiceRotationMember = FieldServiceRotationMember;
