import { Router } from "express";
import UserController from "./controllers/UserController";
import CongregationController from "./controllers/CongregationController";
import ProfileController from "./controllers/ProfileController";
import DocumentController from "./controllers/DocumentController";
import CategoryController from "./controllers/CategoryController";
import RoleController from "./controllers/RoleController";
import PermissionController from "./controllers/PermissionController";

const routes = Router()

routes.post('/user', UserController.create)
routes.put('/user/roles', UserController.updateRoles)
routes.post('/login', UserController.login)

routes.post('/congregation', CongregationController.create)
routes.delete('/congregation/:id', CongregationController.delete)

routes.post('/category', CategoryController.create)

routes.post('/new-document', DocumentController.create)
routes.post('/documents-congregation', DocumentController.filter)

routes.post('/profile', ProfileController.create)
routes.put('/profile', ProfileController.update)
routes.patch('/profile', ProfileController.delete)

routes.post('/role', RoleController.create)

routes.post('/permission', PermissionController.create)

routes.post('/notices')
routes.get('/notices/:congregationId')


export default routes