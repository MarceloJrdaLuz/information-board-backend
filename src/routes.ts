import { Router } from "express";
import UserController from "./controllers/UserController";
import CongregationController from "./controllers/CongregationController";
import ProfileController from "./controllers/ProfileController";
import DocumentController from "./controllers/DocumentController";
import CategoryController from "./controllers/CategoryController";
import RoleController from "./controllers/RoleController";
import PermissionController from "./controllers/PermissionController";
import { is } from "./middlewares/permissions";
import { uploadFile } from "./config/multer";
import PublisherControllers from "./controllers/PublisherControllers";
import ReportController from "./controllers/ReportController";
import GroupController from "./controllers/GroupController";
import ConsentRecordController from "./controllers/ConsentRecordController";
import NoticeController from "./controllers/NoticeController";

const routes = Router()

routes.post('/user', UserController.create) //
routes.post('/login', UserController.login) //
routes.post('/recover-user-information', UserController.recoverUserInformation) //
routes.post('/forgot_password', UserController.forgot_password) //
routes.post('/reset_password', UserController.reset_password) //
routes.post('/add-domain', is(['ADMIN', 'ADMIN_CONGREGATION']), UserController.addUserDomain) 
routes.put('/user/roles', is(['ADMIN', 'ADMIN_CONGREGATION']), UserController.updateRoles) 
routes.get('/users', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ UserController.getUsers) 

routes.post('/publisher', PublisherControllers.create)
routes.delete('/publisher/:id', PublisherControllers.delete)
routes.put('/publisher/', PublisherControllers.update)
routes.get('/publishers/congregationId/:congregation_id', PublisherControllers.getPublishers)
routes.get('/publishers/congregationNumber/:congregationNumber', PublisherControllers.getPublishersWithCongregatioNumber)
routes.get('/publisher/:publisher_id', PublisherControllers.getPublisher)

routes.post('/congregation', /*is(['ADMIN']),*/uploadFile.single('image'),  CongregationController.create) //
routes.delete('/congregation/:id', /*is(['ADMIN']),*/ CongregationController.delete)
routes.get('/congregations', /*is(['ADMIN']),*/ CongregationController.list)
routes.get('/congregation/:number', /*is(['ADMIN']),*/ CongregationController.getCongregation)
routes.put('/congregation/:congregation_id', CongregationController.update)
routes.put('/congregation/:congregation_id/photo',uploadFile.single('image'), CongregationController.uploadCongregationPhoto)

routes.post('/category', /*is(['ADMIN']),*/ CategoryController.create)
routes.get('/category', /*is(['ADMIN']),*/ CategoryController.getCategories)

routes.post('/new-document', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ uploadFile.single('file'),  DocumentController.create)
routes.get('/documents-congregation/:congregation_id', DocumentController.filter)
routes.delete('/document/:document_id', DocumentController.delete)

routes.post('/profile', /*is(['ADMIN']),*/ uploadFile.single('avatar'), ProfileController.create)
routes.put('/profile', /*is(['ADMIN']),*/ uploadFile.single('avatar'), ProfileController.update)
routes.delete('/profile/:id', /*is(['ADMIN']),*/ ProfileController.delete)

routes.post('/role', /*is(['ADMIN']),*/ RoleController.create)
routes.get('/roles', is(['ADMIN', 'ADMIN_CONGREGATION']), RoleController.getRoles)
routes.get('/role/:role_id', /*is(['ADMIN']),*/ RoleController.getRole)
routes.put('/role/:role_id', /*is(['ADMIN']),*/ RoleController.update)

routes.post('/permission', /*is(['ADMIN']),*/ PermissionController.create)
routes.put('/permission/:permission_id', /*is(['ADMIN']),*/ PermissionController.update)
routes.get('/permission', /*is(['ADMIN']),*/ PermissionController.getPermissions)
routes.get('/permission/:permission_id', PermissionController.getPermission)


routes.get('/notices/:congregation_id', NoticeController.get)
routes.post('/notice/:congregation_id', NoticeController.create)

routes.post('/report', /*checkExistingConsent,*/ ReportController.create)
routes.get('/reports/:congregationId', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ ReportController.getReports)

routes.post('/group/:group_id/add-publishers', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ GroupController.addPublishersGroup)
routes.delete('/group/:group_id/remove-publishers', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ GroupController.removePublishersGroup)
routes.post('/group', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ GroupController.create)
routes.get('/groups/:congregation_id', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ GroupController.getGroups)

routes.post('/consentRecord', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ ConsentRecordController.create)
routes.post('/checkConsentRecords', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ ConsentRecordController.checkConsent)



export default routes