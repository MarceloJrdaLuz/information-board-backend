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
exports.Group = void 0;
const typeorm_1 = require("typeorm");
const GroupOverseers_1 = require("./GroupOverseers");
const Congregation_1 = require("./Congregation");
const Publisher_1 = require("./Publisher");
let Group = class Group {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Group.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Group.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Group.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, congregation => congregation.groups) // Relacionamento Many-to-One com Congregation
    ,
    (0, typeorm_1.JoinColumn)({ name: 'congregation_id' }),
    __metadata("design:type", Congregation_1.Congregation)
], Group.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Publisher_1.Publisher, publisher => publisher.group),
    __metadata("design:type", Array)
], Group.prototype, "publishers", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => GroupOverseers_1.GroupOverseers, { eager: true, nullable: true, onDelete: "SET NULL" }) // Relacionamento Many-to-One com GroupOverseers
    ,
    (0, typeorm_1.JoinColumn)({ name: 'group_overseers_id' }),
    __metadata("design:type", Object)
], Group.prototype, "groupOverseers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Group.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Group.prototype, "updated_at", void 0);
Group = __decorate([
    (0, typeorm_1.Entity)('group')
], Group);
exports.Group = Group;
