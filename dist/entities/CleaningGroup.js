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
exports.CleaningGroup = void 0;
const typeorm_1 = require("typeorm");
const Congregation_1 = require("./Congregation");
const Publisher_1 = require("./Publisher");
let CleaningGroup = class CleaningGroup {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CleaningGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, { onDelete: "CASCADE" }),
    __metadata("design:type", Congregation_1.Congregation)
], CleaningGroup.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], CleaningGroup.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CleaningGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Publisher_1.Publisher),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], CleaningGroup.prototype, "publishers", void 0);
CleaningGroup = __decorate([
    (0, typeorm_1.Entity)("cleaning_group")
], CleaningGroup);
exports.CleaningGroup = CleaningGroup;
