"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@simplewebauthn/server");
const helpers_1 = require("@simplewebauthn/server/helpers");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const typeorm_1 = require("typeorm");
const PasskeyChallenge_1 = require("../../entities/PasskeyChallenge");
const api_errors_1 = require("../../helpers/api-errors");
const permissions_1 = require("../../middlewares/permissions");
const passkeyChallengeRepository_1 = require("../../repositories/passkeyChallengeRepository");
const passkeyCredentialRepository_1 = require("../../repositories/passkeyCredentialRepository");
const userRepository_1 = require("../../repositories/userRepository");
function getRpId(req) {
    if (process.env.RP_ID)
        return process.env.RP_ID;
    const origin = req.get("origin") || req.get("referer");
    if (origin) {
        try {
            const url = new URL(origin);
            return url.hostname;
        }
        catch (_a) { }
    }
    return req.hostname || "localhost";
}
function getExpectedOrigins(req) {
    const origins = new Set();
    // Origem enviada pelo navegador do cliente
    const reqOrigin = req.get("origin");
    if (reqOrigin)
        origins.add(reqOrigin.replace(/\/$/, ""));
    const referer = req.get("referer");
    if (referer) {
        try {
            const refUrl = new URL(referer);
            origins.add(refUrl.origin);
        }
        catch (_a) { }
    }
    // URLs configuradas nas variáveis de ambiente do backend (se existirem)
    if (process.env.APP_URL) {
        origins.add(process.env.APP_URL.replace(/\/$/, ""));
    }
    if (process.env.FRONTEND_URL) {
        origins.add(process.env.FRONTEND_URL.replace(/\/$/, ""));
    }
    // Portas de desenvolvimento local
    if (process.env.ENVIRONMENT === "local" || process.env.NODE_ENV !== "production") {
        origins.add("http://localhost:3000");
        origins.add("http://localhost:3001");
    }
    return Array.from(origins);
}
class PasskeyController {
    /**
     * 1. Gera opções de registro de uma nova Chave de Acesso (Passkey)
     * Requer usuário autenticado.
     */
    async getRegistrationOptions(req, res) {
        const authUser = await (0, permissions_1.decoder)(req);
        const user = await userRepository_1.userRepository.findOne({
            where: { id: authUser.id }
        });
        if (!user) {
            throw new api_errors_1.NotFoundError("Usuário não encontrado.");
        }
        // Credenciais que o usuário já tem cadastradas (para não cadastrar a mesma no aparelho)
        const userPasskeys = await passkeyCredentialRepository_1.passkeyCredentialRepository.find({
            where: { userId: user.id }
        });
        const rpID = getRpId(req);
        const rpName = process.env.RP_NAME || "Quadro de Anúncios";
        const options = await (0, server_1.generateRegistrationOptions)({
            rpName,
            rpID,
            userID: helpers_1.isoUint8Array.fromUTF8String(user.id),
            userName: user.email,
            userDisplayName: user.fullName || user.email,
            attestationType: "none",
            excludeCredentials: userPasskeys.map(pk => ({
                id: pk.credentialId,
                transports: pk.transports ? JSON.parse(pk.transports) : undefined
            })),
            authenticatorSelection: {
                residentKey: "preferred",
                userVerification: "preferred"
            }
        });
        // Limpa desafios expirados
        await passkeyChallengeRepository_1.passkeyChallengeRepository.delete({
            expiresAt: (0, typeorm_1.LessThan)(new Date())
        });
        // Salva o novo desafio temporário (válido por 5 minutos)
        await passkeyChallengeRepository_1.passkeyChallengeRepository.save({
            challenge: options.challenge,
            userId: user.id,
            email: user.email,
            type: PasskeyChallenge_1.PasskeyChallengeType.REGISTRATION,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });
        return res.json(options);
    }
    /**
     * 2. Verifica a resposta biométrica e salva a nova Chave de Acesso
     * Requer usuário autenticado.
     */
    async verifyRegistration(req, res) {
        var _a;
        const authUser = await (0, permissions_1.decoder)(req);
        const { response: registrationResponse, nickname } = req.body;
        if (!registrationResponse) {
            throw new api_errors_1.BadRequestError("Dados de resposta da chave de acesso ausentes.");
        }
        // Busca o desafio de registro recente deste usuário
        const challengeRecord = await passkeyChallengeRepository_1.passkeyChallengeRepository.findOne({
            where: {
                userId: authUser.id,
                type: PasskeyChallenge_1.PasskeyChallengeType.REGISTRATION
            },
            order: { createdAt: "DESC" }
        });
        if (!challengeRecord || new Date() > challengeRecord.expiresAt) {
            throw new api_errors_1.BadRequestError("Desafio de registro expirado ou inválido. Tente novamente.");
        }
        const expectedOrigins = getExpectedOrigins(req);
        const expectedRPID = getRpId(req);
        let verification;
        try {
            verification = await (0, server_1.verifyRegistrationResponse)({
                response: registrationResponse,
                expectedChallenge: challengeRecord.challenge,
                expectedOrigin: expectedOrigins,
                expectedRPID,
                requireUserVerification: false
            });
        }
        catch (error) {
            console.error("Erro na verificação do registro de Passkey:", error);
            throw new api_errors_1.BadRequestError(`Falha na validação da chave de acesso: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
        }
        if (!verification.verified || !verification.registrationInfo) {
            throw new api_errors_1.BadRequestError("Não foi possível verificar a chave de acesso.");
        }
        const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
        // Salva a credencial pública no banco
        const savedPasskey = await passkeyCredentialRepository_1.passkeyCredentialRepository.save({
            userId: authUser.id,
            credentialId: credential.id,
            publicKey: helpers_1.isoBase64URL.fromBuffer(credential.publicKey),
            counter: Number(credential.counter || 0),
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: JSON.stringify(((_a = registrationResponse.response) === null || _a === void 0 ? void 0 : _a.transports) || []),
            nickname: nickname && nickname.trim() ? nickname.trim() : "Chave de Acesso"
        });
        // Remove o desafio usado
        await passkeyChallengeRepository_1.passkeyChallengeRepository.delete({ id: challengeRecord.id });
        return res.status(201).json({
            verified: true,
            passkey: {
                id: savedPasskey.id,
                nickname: savedPasskey.nickname,
                createdAt: savedPasskey.createdAt
            }
        });
    }
    /**
     * 3. Gera opções para autenticação / login com Chave de Acesso
     * Rota pública.
     */
    async getAuthenticationOptions(req, res) {
        const email = typeof req.query.email === "string" ? req.query.email.trim() : null;
        const rpID = getRpId(req);
        let allowCredentials = undefined;
        if (email) {
            const user = await userRepository_1.userRepository.findOne({
                where: { email },
                relations: ["passkeyCredentials"]
            });
            if (user && user.passkeyCredentials && user.passkeyCredentials.length > 0) {
                allowCredentials = user.passkeyCredentials.map(pk => ({
                    id: pk.credentialId,
                    transports: pk.transports ? JSON.parse(pk.transports) : undefined
                }));
            }
        }
        const options = await (0, server_1.generateAuthenticationOptions)({
            rpID,
            allowCredentials,
            userVerification: "preferred"
        });
        // Limpa desafios expirados
        await passkeyChallengeRepository_1.passkeyChallengeRepository.delete({
            expiresAt: (0, typeorm_1.LessThan)(new Date())
        });
        // Salva o desafio de autenticação (5 minutos)
        await passkeyChallengeRepository_1.passkeyChallengeRepository.save({
            challenge: options.challenge,
            email: email || null,
            type: PasskeyChallenge_1.PasskeyChallengeType.AUTHENTICATION,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });
        return res.json(options);
    }
    /**
     * 4. Valida a assinatura biométrica da Chave de Acesso e efetua o login (emite JWT)
     * Rota pública.
     */
    async verifyAuthentication(req, res) {
        var _a;
        const { response: authResponse } = req.body;
        if (!authResponse || !authResponse.id) {
            throw new api_errors_1.BadRequestError("Dados de autenticação biométrica inválidos.");
        }
        // Localiza a credencial correspondente pelo credentialId
        const credential = await passkeyCredentialRepository_1.passkeyCredentialRepository.findOne({
            where: { credentialId: authResponse.id },
            relations: ["user"]
        });
        if (!credential) {
            throw new api_errors_1.UnauthorizedError("Chave de acesso não reconhecida neste sistema.");
        }
        // Localiza o desafio mais recente de autenticação
        const challengeRecord = await passkeyChallengeRepository_1.passkeyChallengeRepository.findOne({
            where: {
                type: PasskeyChallenge_1.PasskeyChallengeType.AUTHENTICATION
            },
            order: { createdAt: "DESC" }
        });
        if (!challengeRecord || new Date() > challengeRecord.expiresAt) {
            throw new api_errors_1.UnauthorizedError("Desafio de autenticação expirado ou inválido. Tente novamente.");
        }
        const expectedOrigins = getExpectedOrigins(req);
        const expectedRPID = getRpId(req);
        let verification;
        try {
            verification = await (0, server_1.verifyAuthenticationResponse)({
                response: authResponse,
                expectedChallenge: challengeRecord.challenge,
                expectedOrigin: expectedOrigins,
                expectedRPID,
                credential: {
                    id: credential.credentialId,
                    publicKey: helpers_1.isoBase64URL.toBuffer(credential.publicKey),
                    counter: Number(credential.counter),
                    transports: credential.transports ? JSON.parse(credential.transports) : undefined
                },
                requireUserVerification: false
            });
        }
        catch (error) {
            console.error("Erro na verificação da assinatura do Passkey:", error);
            throw new api_errors_1.UnauthorizedError(`Falha na validação da biometria: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
        }
        if (!verification.verified) {
            throw new api_errors_1.UnauthorizedError("Falha na autenticação com chave de acesso.");
        }
        // Atualiza o contador de segurança e data de último uso
        credential.counter = verification.authenticationInfo.newCounter;
        credential.lastUsedAt = new Date();
        await passkeyCredentialRepository_1.passkeyCredentialRepository.save(credential);
        // Remove o desafio consumido
        await passkeyChallengeRepository_1.passkeyChallengeRepository.delete({ id: challengeRecord.id });
        // Busca o usuário completo exatamente como no login tradicional
        const userList = await userRepository_1.userRepository.find({
            where: { id: credential.userId },
            relations: ['congregation', 'congregation.speakerCoordinator', 'congregation.watchtowerConductor', 'profile']
        });
        if (!userList || userList.length === 0) {
            throw new api_errors_1.UnauthorizedError("Usuário não encontrado.");
        }
        const foundUser = userList[0];
        // Emite o token JWT idêntico ao login tradicional
        const token = jsonwebtoken_1.default.sign({ id: foundUser.id }, (_a = process.env.JWT_PASS) !== null && _a !== void 0 ? _a : '', {
            subject: foundUser.id,
            expiresIn: '30d'
        });
        const { password: _, ...userLogin } = foundUser;
        return res.json({
            user: userLogin,
            token
        });
    }
    /**
     * 5. Lista todas as Chaves de Acesso do usuário logado
     */
    async listUserPasskeys(req, res) {
        const authUser = await (0, permissions_1.decoder)(req);
        const passkeys = await passkeyCredentialRepository_1.passkeyCredentialRepository.find({
            where: { userId: authUser.id },
            order: { createdAt: "DESC" },
            select: ["id", "credentialId", "nickname", "deviceType", "backedUp", "createdAt", "lastUsedAt"]
        });
        return res.json(passkeys);
    }
    /**
     * 6. Remove/revoga uma Chave de Acesso pelo ID
     */
    async deletePasskey(req, res) {
        const authUser = await (0, permissions_1.decoder)(req);
        const { id } = req.params;
        const passkey = await passkeyCredentialRepository_1.passkeyCredentialRepository.findOne({
            where: { id, userId: authUser.id }
        });
        if (!passkey) {
            throw new api_errors_1.NotFoundError("Chave de acesso não encontrada.");
        }
        await passkeyCredentialRepository_1.passkeyCredentialRepository.remove(passkey);
        return res.json({ message: "Chave de acesso removida com sucesso." });
    }
}
exports.default = new PasskeyController();
