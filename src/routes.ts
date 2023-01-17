import { Router } from "express";
import UserController from "./controllers/UserController";
import CongregationController from "./controllers/CongregationController";
import ProfileController from "./controllers/ProfileController";
import DocumentController from "./controllers/DocumentController";
import CategoryController from "./controllers/CategoryController";

const routes = Router()

routes.post('/create-user', UserController.create)
routes.post('/login', UserController.login)

routes.post('/create-congregation', CongregationController.create)

routes.post('/create-category', CategoryController.create)

routes.post('/new-document', DocumentController.create)
routes.post('/documents-congregation', DocumentController.filter)

routes.post('/create-profile', ProfileController.create)
routes.post('/create-profile', ProfileController.create)
routes.put('/update-profile', ProfileController.update)


export default routes