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
exports.Territory = void 0;
const typeorm_1 = require("typeorm");
const TerritoryHistory_1 = require("./TerritoryHistory");
const Congregation_1 = require("./Congregation");
let Territory = class Territory {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Territory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Territory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], Territory.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Territory.prototype, "image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Territory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Territory.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Territory.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Territory.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Congregation_1.Congregation, congregation => congregation.territories, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: 'congregation_id' }),
    __metadata("design:type", Congregation_1.Congregation)
], Territory.prototype, "congregation", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TerritoryHistory_1.TerritoryHistory, history => history.territory, { cascade: true }),
    __metadata("design:type", Array)
], Territory.prototype, "histories", void 0);
Territory = __decorate([
    (0, typeorm_1.Entity)('territory')
], Territory);
exports.Territory = Territory;
