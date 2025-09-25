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
exports.Talk = void 0;
const typeorm_1 = require("typeorm");
const Speaker_1 = require("./Speaker");
let Talk = class Talk {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Talk.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", unique: true }),
    __metadata("design:type", Number)
], Talk.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Talk.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Speaker_1.Speaker, speaker => speaker.talks),
    __metadata("design:type", Array)
], Talk.prototype, "speakers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Talk.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Talk.prototype, "updated_at", void 0);
Talk = __decorate([
    (0, typeorm_1.Entity)("talks")
], Talk);
exports.Talk = Talk;
