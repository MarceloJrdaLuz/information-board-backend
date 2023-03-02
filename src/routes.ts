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

const routes = Router()

routes.post('/user', UserController.create)
routes.post('/login', UserController.login)
routes.post('/recover-user-information', UserController.recoverUserInformation)
routes.put('/user/roles', is(['ADMIN', 'ADMIN_CONGREGATION']), UserController.updateRoles) 
routes.post('/forgot_password', UserController.forgot_password)
routes.post('/reset_password', UserController.reset_password)

routes.post('/publisher', PublisherControllers.create)
routes.delete('/publisher/:id', PublisherControllers.delete)
routes.put('/publisher', PublisherControllers.update)

routes.post('/congregation', /*is(['ADMIN']),*/ CongregationController.create)
routes.delete('/congregation/:id', /*is(['ADMIN']),*/ CongregationController.delete)
routes.get('/congregations', /*is(['ADMIN']),*/ CongregationController.list)
routes.get('/congregation/:number', /*is(['ADMIN']),*/ CongregationController.getCongregation)

routes.post('/category', /*is(['ADMIN']),*/ CategoryController.create)

routes.post('/new-document', /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/ uploadFile.single('file'),  DocumentController.create)
// routes.get('/documents-congregation/:congregation_id', DocumentController.filter)

routes.post('/profile', /*is(['ADMIN']),*/ uploadFile.single('avatar'), ProfileController.create)
routes.put('/profile', /*is(['ADMIN']),*/ uploadFile.single('avatar'), ProfileController.update)
routes.delete('/profile/:id', /*is(['ADMIN']),*/ ProfileController.delete)

routes.post('/role', /*is(['ADMIN']),*/ RoleController.create)

routes.post('/permission', /*is(['ADMIN']),*/ PermissionController.create)

routes.post('/notices' /*is(['ADMIN', 'ADMIN_CONGREGATION']),*/)
routes.get('/notices/:congregationId')


export default routes