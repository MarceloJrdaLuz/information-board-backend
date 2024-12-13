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
exports.TerritoryHistory = void 0;
const typeorm_1 = require("typeorm");
const Territory_1 = require("./Territory");
let TerritoryHistory = class TerritoryHistory {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TerritoryHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Territory_1.Territory, territory => territory.histories, { onDelete: 'CASCADE' }),
    __metadata("design:type", Territory_1.Territory)
], TerritoryHistory.prototype, "territory", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TerritoryHistory.prototype, "caretaker", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TerritoryHistory.prototype, "work_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], TerritoryHistory.prototype, "assignment_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], TerritoryHistory.prototype, "completion_date", void 0);
TerritoryHistory = __decorate([
    (0, typeorm_1.Entity)('territory_history')
], TerritoryHistory);
exports.TerritoryHistory = TerritoryHistory;
