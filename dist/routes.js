"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = __importDefault(require("./controllers/UserController"));
const CongregationController_1 = __importDefault(require("./controllers/CongregationController"));
const ProfileController_1 = __importDefault(require("./controllers/ProfileController"));
const DocumentController_1 = __importDefault(require("./controllers/DocumentController"));
const CategoryController_1 = __importDefault(require("./controllers/CategoryController"));
const RoleController_1 = __importDefault(require("./controllers/RoleController"));
const PermissionController_1 = __importDefault(require("./controllers/PermissionController"));
const permissions_1 = require("./middlewares/permissions");
const multer_1 = require("./config/multer");
const PublisherControllers_1 = __importDefault(require("./controllers/PublisherControllers"));
const ReportController_1 = __importDefault(require("./controllers/ReportController"));
const GroupController_1 = __importDefault(require("./controllers/GroupController"));
const ConsentRecordController_1 = __importDefault(require("./controllers/ConsentRecordController"));
const NoticeController_1 = __importDefault(require("./controllers/NoticeController"));
const routes = (0, express_1.Router)();
routes.post('/user', UserController_1.default.create); //
routes.post('/login', UserController_1.default.login); //
routes.post('/recover-user-information', UserController_1.default.recoverUserInformation); //
routes.post('/forgot_password', UserController_1.default.forgot_password); //
routes.post('/reset_password', UserController_1.default.reset_password); //
routes.post('/add-domain', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), UserController_1.default.addUserDomain);
routes.put('/user/roles', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), UserController_1.default.updateRoles);
routes.get('/users', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ UserController_1.default.getUsers);
routes.get('/publishers/congregationId/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER', 'PUBLISHERS_VIEWER']), PublisherControllers_1.default.getPublishers);
routes.get('/publishers/congregationNumber/:congregationNumber', PublisherControllers_1.default.getPublishersWithCongregatioNumber);
routes.get('/publisher/:publisher_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers_1.default.getPublisher);
routes.post('/publisher', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers_1.default.create);
routes.delete('/publisher/:publisher_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers_1.default.delete);
routes.put('/publisher/:publisher_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'PUBLISHERS_MANAGER']), PublisherControllers_1.default.update);
routes.post('/congregation', (0, permissions_1.is)(['ADMIN']), multer_1.uploadFile.single('image'), CongregationController_1.default.create); //
routes.delete('/congregation/:id', (0, permissions_1.is)(['ADMIN']), CongregationController_1.default.delete);
routes.get('/congregations', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), CongregationController_1.default.list);
routes.get('/congregation/:number', /*is(['ADMIN']),*/ CongregationController_1.default.getCongregation);
routes.put('/congregation/:congregation_id', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), CongregationController_1.default.update);
routes.put('/congregation/:congregation_id/photo', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), multer_1.uploadFile.single('image'), CongregationController_1.default.uploadCongregationPhoto);
routes.post('/category', (0, permissions_1.is)(['ADMIN']), CategoryController_1.default.create);
routes.put('/category/:category_id', (0, permissions_1.is)(['ADMIN']), CategoryController_1.default.update);
routes.get('/categories', CategoryController_1.default.getCategories);
routes.get('/category/:category_id', CategoryController_1.default.getPermission);
routes.post('/new-document', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'DOCUMENTS_MANAGER']), multer_1.uploadFile.single('file'), DocumentController_1.default.create);
routes.get('/documents-congregation/:congregation_id', DocumentController_1.default.filter);
routes.delete('/document/:document_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'DOCUMENTS_MANAGER']), DocumentController_1.default.delete);
routes.post('/profile/:user_id', /*is(['ADMIN']),*/ multer_1.uploadFile.single('avatar'), ProfileController_1.default.create);
routes.put('/profile/:profile_id', /*is(['ADMIN']),*/ multer_1.uploadFile.single('avatar'), ProfileController_1.default.update);
routes.delete('/profile/:id', /*is(['ADMIN']),*/ ProfileController_1.default.delete);
routes.post('/role', (0, permissions_1.is)(['ADMIN']), RoleController_1.default.create);
routes.get('/roles', (0, permissions_1.is)(['ADMIN', 'ADMIN_CONGREGATION']), RoleController_1.default.getRoles);
routes.get('/role/:role_id', (0, permissions_1.is)(['ADMIN']), RoleController_1.default.getRole);
routes.delete('/role/:role_id', (0, permissions_1.is)(['ADMIN']), RoleController_1.default.delete);
routes.put('/role/:role_id', (0, permissions_1.is)(['ADMIN']), RoleController_1.default.update);
routes.post('/permission', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.create);
routes.put('/permission/:permission_id', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.update);
routes.delete('/permission/:permission_id', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.delete);
routes.get('/permission', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.getPermissions);
routes.get('/permission/:permission_id', (0, permissions_1.is)(['ADMIN']), PermissionController_1.default.getPermission);
routes.get('/notices/:congregation_id', NoticeController_1.default.getNotices);
routes.post('/notice/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController_1.default.create);
routes.get('/notice/:notice_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController_1.default.getNotice);
routes.delete('/notice/:notice_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController_1.default.delete);
routes.put('/notice/:notice_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'NOTICES_MANAGER']), NoticeController_1.default.update);
routes.post('/report', ReportController_1.default.create);
routes.get('/reports/:congregationId', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'REPORTS_MANAGER', 'REPORTS_VIEWER']), ReportController_1.default.getReports);
routes.post('/group/:group_id/add-publishers', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.addPublishersGroup);
routes.delete('/group/:group_id/remove-publishers', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.removePublishersGroup);
routes.delete('/group/:group_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.delete);
routes.post('/group', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.create);
routes.get('/groups/:congregation_id', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER', 'GROUPS_VIEWER']), GroupController_1.default.getGroups);
routes.put('/group/:group_id/change-groupOverseer', (0, permissions_1.is)(['ADMIN_CONGREGATION', 'GROUPS_MANAGER']), GroupController_1.default.updateGroupOverseer);
routes.post('/consentRecord', ConsentRecordController_1.default.create);
routes.post('/checkConsentRecords', ConsentRecordController_1.default.checkConsent);
exports.default = routes;
