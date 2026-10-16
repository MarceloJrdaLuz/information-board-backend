import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { LessThan } from "typeorm";
import { PasskeyChallengeType } from "../../entities/PasskeyChallenge";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../helpers/api-errors";
import { decoder } from "../../middlewares/permissions";
import { passkeyChallengeRepository } from "../../repositories/passkeyChallengeRepository";
import { passkeyCredentialRepository } from "../../repositories/passkeyCredentialRepository";
import { userRepository } from "../../repositories/userRepository";

function getRpId(req: Request): string {
    if (process.env.RP_ID) return process.env.RP_ID;
    const origin = req.get("origin") || req.get("referer");
    if (origin) {
        try {
            const url = new URL(origin);
            return url.hostname;
        } catch { }
    }
    return req.hostname || "localhost";
}

function getExpectedOrigins(req: Request): string[] {
    const origins = new Set<string>();
    if (process.env.FRONTEND_URL) {
        origins.add(process.env.FRONTEND_URL.replace(/\/$/, ""));
    }
    origins.add("http://localhost:3000");
    origins.add("http://localhost:3001");
    origins.add("https://quadrodeanuncios.com.br");
    origins.add("https://www.quadrodeanuncios.com.br");

    const reqOrigin = req.get("origin");
    if (reqOrigin) origins.add(reqOrigin.replace(/\/$/, ""));

    return Array.from(origins);
}

class PasskeyController {
    /**
     * 1. Gera opções de registro de uma nova Chave de Acesso (Passkey)
     * Requer usuário autenticado.
     */
    async getRegistrationOptions(req: Request, res: Response) {
        const authUser = await decoder(req);

        const user = await userRepository.findOne({
            where: { id: authUser.id }
        });

        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }

        // Credenciais que o usuário já tem cadastradas (para não cadastrar a mesma no aparelho)
        const userPasskeys = await passkeyCredentialRepository.find({
            where: { userId: user.id }
        });

        const rpID = getRpId(req);
        const rpName = process.env.RP_NAME || "Quadro de Anúncios";

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: isoUint8Array.fromUTF8String(user.id),
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
        await passkeyChallengeRepository.delete({
            expiresAt: LessThan(new Date())
        });

        // Salva o novo desafio temporário (válido por 5 minutos)
        await passkeyChallengeRepository.save({
            challenge: options.challenge,
            userId: user.id,
            email: user.email,
            type: PasskeyChallengeType.REGISTRATION,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });

        return res.json(options);
    }

    /**
     * 2. Verifica a resposta biométrica e salva a nova Chave de Acesso
     * Requer usuário autenticado.
     */
    async verifyRegistration(req: Request, res: Response) {
        const authUser = await decoder(req);
        const { response: registrationResponse, nickname } = req.body;

        if (!registrationResponse) {
            throw new BadRequestError("Dados de resposta da chave de acesso ausentes.");
        }

        // Busca o desafio de registro recente deste usuário
        const challengeRecord = await passkeyChallengeRepository.findOne({
            where: {
                userId: authUser.id,
                type: PasskeyChallengeType.REGISTRATION
            },
            order: { createdAt: "DESC" }
        });

        if (!challengeRecord || new Date() > challengeRecord.expiresAt) {
            throw new BadRequestError("Desafio de registro expirado ou inválido. Tente novamente.");
        }

        const expectedOrigins = getExpectedOrigins(req);
        const expectedRPID = getRpId(req);

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response: registrationResponse,
                expectedChallenge: challengeRecord.challenge,
                expectedOrigin: expectedOrigins,
                expectedRPID,
                requireUserVerification: false
            });
        } catch (error: any) {
            console.error("Erro na verificação do registro de Passkey:", error);
            throw new BadRequestError(`Falha na validação da chave de acesso: ${error?.message || error}`);
        }

        if (!verification.verified || !verification.registrationInfo) {
            throw new BadRequestError("Não foi possível verificar a chave de acesso.");
        }

        const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

        // Salva a credencial pública no banco
        const savedPasskey = await passkeyCredentialRepository.save({
            userId: authUser.id,
            credentialId: credential.id,
            publicKey: isoBase64URL.fromBuffer(credential.publicKey),
            counter: Number(credential.counter || 0),
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: JSON.stringify(registrationResponse.response?.transports || []),
            nickname: nickname && nickname.trim() ? nickname.trim() : "Chave de Acesso"
        });

        // Remove o desafio usado
        await passkeyChallengeRepository.delete({ id: challengeRecord.id });

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
    async getAuthenticationOptions(req: Request, res: Response) {
        const email = typeof req.query.email === "string" ? req.query.email.trim() : null;
        const rpID = getRpId(req);

        let allowCredentials = undefined;

        if (email) {
            const user = await userRepository.findOne({
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

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials,
            userVerification: "preferred"
        });

        // Limpa desafios expirados
        await passkeyChallengeRepository.delete({
            expiresAt: LessThan(new Date())
        });

        // Salva o desafio de autenticação (5 minutos)
        await passkeyChallengeRepository.save({
            challenge: options.challenge,
            email: email || null,
            type: PasskeyChallengeType.AUTHENTICATION,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });

        return res.json(options);
    }

    /**
     * 4. Valida a assinatura biométrica da Chave de Acesso e efetua o login (emite JWT)
     * Rota pública.
     */
    async verifyAuthentication(req: Request, res: Response) {
        const { response: authResponse } = req.body;

        if (!authResponse || !authResponse.id) {
            throw new BadRequestError("Dados de autenticação biométrica inválidos.");
        }

        // Localiza a credencial correspondente pelo credentialId
        const credential = await passkeyCredentialRepository.findOne({
            where: { credentialId: authResponse.id },
            relations: ["user"]
        });

        if (!credential) {
            throw new UnauthorizedError("Chave de acesso não reconhecida neste sistema.");
        }

        // Localiza o desafio mais recente de autenticação
        const challengeRecord = await passkeyChallengeRepository.findOne({
            where: {
                type: PasskeyChallengeType.AUTHENTICATION
            },
            order: { createdAt: "DESC" }
        });

        if (!challengeRecord || new Date() > challengeRecord.expiresAt) {
            throw new UnauthorizedError("Desafio de autenticação expirado ou inválido. Tente novamente.");
        }

        const expectedOrigins = getExpectedOrigins(req);
        const expectedRPID = getRpId(req);

        let verification;
        try {
            verification = await verifyAuthenticationResponse({
                response: authResponse,
                expectedChallenge: challengeRecord.challenge,
                expectedOrigin: expectedOrigins,
                expectedRPID,
                credential: {
                    id: credential.credentialId,
                    publicKey: isoBase64URL.toBuffer(credential.publicKey),
                    counter: Number(credential.counter),
                    transports: credential.transports ? JSON.parse(credential.transports) : undefined
                },
                requireUserVerification: false
            });
        } catch (error: any) {
            console.error("Erro na verificação da assinatura do Passkey:", error);
            throw new UnauthorizedError(`Falha na validação da biometria: ${error?.message || error}`);
        }

        if (!verification.verified) {
            throw new UnauthorizedError("Falha na autenticação com chave de acesso.");
        }

        // Atualiza o contador de segurança e data de último uso
        credential.counter = verification.authenticationInfo.newCounter;
        credential.lastUsedAt = new Date();
        await passkeyCredentialRepository.save(credential);

        // Remove o desafio consumido
        await passkeyChallengeRepository.delete({ id: challengeRecord.id });

        // Busca o usuário completo exatamente como no login tradicional
        const userList = await userRepository.find({
            where: { id: credential.userId },
            relations: ['congregation', 'congregation.speakerCoordinator', 'congregation.watchtowerConductor', 'profile']
        });

        if (!userList || userList.length === 0) {
            throw new UnauthorizedError("Usuário não encontrado.");
        }

        const foundUser = userList[0];

        // Emite o token JWT idêntico ao login tradicional
        const token = jwt.sign({ id: foundUser.id }, process.env.JWT_PASS ?? '', {
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
    async listUserPasskeys(req: Request, res: Response) {
        const authUser = await decoder(req);

        const passkeys = await passkeyCredentialRepository.find({
            where: { userId: authUser.id },
            order: { createdAt: "DESC" },
            select: ["id", "credentialId", "nickname", "deviceType", "backedUp", "createdAt", "lastUsedAt"]
        });

        return res.json(passkeys);
    }

    /**
     * 6. Remove/revoga uma Chave de Acesso pelo ID
     */
    async deletePasskey(req: Request, res: Response) {
        const authUser = await decoder(req);
        const { id } = req.params;

        const passkey = await passkeyCredentialRepository.findOne({
            where: { id, userId: authUser.id }
        });

        if (!passkey) {
            throw new NotFoundError("Chave de acesso não encontrada.");
        }

        await passkeyCredentialRepository.remove(passkey);

        return res.json({ message: "Chave de acesso removida com sucesso." });
    }
}

export default new PasskeyController();

