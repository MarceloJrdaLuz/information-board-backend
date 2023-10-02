"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_errors_1 = require("../../helpers/api-errors");
const categoryRepository_1 = require("../../repositories/categoryRepository");
const messageErrors_1 = require("../../helpers/messageErrors");
class CategoryController {
    async create(req, res) {
        const { name, description } = req.body;
        const categoryExists = await categoryRepository_1.categoryRepository.findOneBy({ name });
        const descriptionExists = await categoryRepository_1.categoryRepository.findOneBy({ description });
        if (categoryExists) {
            throw new api_errors_1.BadRequestError('Category already exists');
        }
        if (descriptionExists) {
            throw new api_errors_1.BadRequestError('Description already exists');
        }
        const newCategory = categoryRepository_1.categoryRepository.create({
            name,
            description
        });
        await categoryRepository_1.categoryRepository.save(newCategory);
        return res.status(201).json(newCategory);
    }
    async update(req, res) {
        const { category_id } = req.params;
        const { name, description } = req.body;
        const category = await categoryRepository_1.categoryRepository.findOneBy({ id: category_id });
        if (!category)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.category);
        category.name = name !== undefined ? name : category.name;
        category.description = description !== undefined ? description : category.description;
        await categoryRepository_1.categoryRepository.save(category);
        return res.status(201).json(category);
    }
    async getPermission(req, res) {
        const { category_id } = req.params;
        const category = await categoryRepository_1.categoryRepository.findOneBy({ id: category_id });
        if (!category)
            throw new api_errors_1.NotFoundError(messageErrors_1.messageErrors.notFound.category);
        return res.status(200).json(category);
    }
    async getCategories(req, res) {
        const categories = await categoryRepository_1.categoryRepository.find({});
        if (!categories)
            throw new api_errors_1.NotFoundError("No category found");
        return res.status(200).json(categories);
    }
}
exports.default = new CategoryController();
