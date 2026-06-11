const db = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

jest.mock("../../config/db", () => ({
    query: jest.fn()
}));

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const {
    register,
    login,
    buscarPerfil,
    atualizarPerfil,
    alterarSenha,
    alterarEmail,
    excluirConta,
    buscarExerciciosExternos
} = require("../../controllers/authController");

describe("authController", () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {},
            query: {},
            user: { id: 1 }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
        process.env.JWT_SECRET = "segredo_teste";
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("register", () => {
        test("deve retornar 400 se campos obrigatórios não forem enviados", async () => {
            req.body = {
                nome: "",
                email: "",
                senha: ""
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Preencha todos os campos"
            });
        });

        test("deve cadastrar usuário com sucesso", async () => {
            req.body = {
                nome: " Fernando ",
                email: " TESTE@EMAIL.COM ",
                senha: "123456"
            };

            bcrypt.hash.mockResolvedValue("senha_hash");

            db.query.mockImplementation((sql, params, callback) => {
                callback(null);
            });

            await register(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith("123456", 10);
            expect(db.query).toHaveBeenCalledWith(
                "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
                ["Fernando", "teste@email.com", "senha_hash"],
                expect.any(Function)
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                mensagem: "Usuário cadastrado com sucesso"
            });
        });

        test("deve retornar 409 se e-mail já estiver cadastrado", async () => {
            req.body = {
                nome: "Fernando",
                email: "teste@email.com",
                senha: "123456"
            };

            bcrypt.hash.mockResolvedValue("senha_hash");

            db.query.mockImplementation((sql, params, callback) => {
                callback({ code: "ER_DUP_ENTRY" });
            });

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Este e-mail já está cadastrado"
            });
        });

        test("deve retornar 500 se ocorrer erro no banco ao cadastrar", async () => {
            req.body = {
                nome: "Fernando",
                email: "teste@email.com",
                senha: "123456"
            };

            bcrypt.hash.mockResolvedValue("senha_hash");

            db.query.mockImplementation((sql, params, callback) => {
                callback(new Error("Erro DB"));
            });

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao cadastrar usuário"
            });
        });

        test("deve retornar 500 se bcrypt.hash lançar erro", async () => {
            req.body = {
                nome: "Fernando",
                email: "teste@email.com",
                senha: "123456"
            };

            bcrypt.hash.mockRejectedValue(new Error("Erro bcrypt"));

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro interno"
            });
        });
    });

    describe("login", () => {
        test("deve retornar 400 se email ou senha não forem enviados", () => {
            req.body = {
                email: "",
                senha: ""
            };

            login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Preencha todos os campos"
            });
        });

        test("deve retornar 500 se der erro no banco", () => {
            req.body = {
                email: "teste@email.com",
                senha: "123456"
            };

            db.query.mockImplementation((sql, params, callback) => {
                callback(new Error("Erro DB"), null);
            });

            login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro no servidor"
            });
        });

        test("deve retornar 401 se usuário não for encontrado", () => {
            req.body = {
                email: "teste@email.com",
                senha: "123456"
            };

            db.query.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });

            login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Usuário não encontrado"
            });
        });

        test("deve retornar 401 se senha estiver incorreta", async () => {
            req.body = {
                email: "teste@email.com",
                senha: "senha_errada"
            };

            db.query.mockImplementation((sql, params, callback) => {
                callback(null, [
                    {
                        id: 1,
                        nome: "Fernando",
                        email: "teste@email.com",
                        senha: "senha_hash",
                        is_admin: 0
                    }
                ]);
            });

            bcrypt.compare.mockResolvedValue(false);

            login(req, res);

            await new Promise(process.nextTick);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Senha incorreta"
            });
        });

        test("deve fazer login com sucesso", async () => {
            req.body = {
                email: " TESTE@EMAIL.COM ",
                senha: "123456"
            };

            const usuario = {
                id: 1,
                nome: "Fernando",
                email: "teste@email.com",
                senha: "senha_hash",
                is_admin: 1
            };

            db.query.mockImplementation((sql, params, callback) => {
                callback(null, [usuario]);
            });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("token_jwt");

            login(req, res);

            await new Promise(process.nextTick);

            expect(db.query).toHaveBeenCalledWith(
                "SELECT * FROM usuarios WHERE email = ?",
                ["teste@email.com"],
                expect.any(Function)
            );

           expect(jwt.sign).toHaveBeenCalledWith(
  {
    id: usuario.id,
    email: usuario.email
  },
  expect.any(String),
  {
    expiresIn: "1h"
  }
);

            expect(res.json).toHaveBeenCalledWith({
                mensagem: "Login realizado com sucesso",
                token: "token_jwt",
                usuario: {
                    id: 1,
                    nome: "Fernando",
                    email: "teste@email.com",
                    is_admin: 1
                }
            });
        });
    });

    describe("buscarPerfil", () => {
        test("deve buscar perfil com sucesso", () => {
            const perfil = {
                nome: "Fernando",
                email: "teste@email.com",
                altura: 1.75,
                peso: 70,
                peito: 90,
                cintura: 80,
                braco: 35,
                coxa: 55,
                panturrilha: 38
            };

            db.query.mockImplementation((sql, params, callback) => {
                callback(null, [perfil]);
            });

            buscarPerfil(req, res);

            expect(res.json).toHaveBeenCalledWith(perfil);
        });

        test("deve retornar 500 se der erro ao buscar perfil", () => {
            db.query.mockImplementation((sql, params, callback) => {
                callback(new Error("Erro DB"), null);
            });

            buscarPerfil(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao buscar perfil"
            });
        });

        test("deve retornar 404 se usuário não for encontrado ao buscar perfil", () => {
            db.query.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });

            buscarPerfil(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Usuário não encontrado"
            });
        });
    });

    describe("atualizarPerfil", () => {
        test("deve atualizar perfil com sucesso", () => {
            req.body = {
                altura: 1.75,
                peso: 70,
                peito: 90,
                cintura: 80,
                braco: 35,
                coxa: 55,
                panturrilha: 38
            };

            db.query.mockImplementation((sql, params, callback) => {
                callback(null);
            });

            atualizarPerfil(req, res);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE usuarios"),
                [1.75, 70, 90, 80, 35, 55, 38, 1],
                expect.any(Function)
            );

            expect(res.json).toHaveBeenCalledWith({
                mensagem: "Perfil atualizado com sucesso"
            });
        });

        test("deve atualizar perfil usando null quando campos forem vazios", () => {
            req.body = {
                altura: "",
                peso: "",
                peito: "",
                cintura: "",
                braco: "",
                coxa: "",
                panturrilha: ""
            };

            db.query.mockImplementation((sql, params, callback) => {
                callback(null);
            });

            atualizarPerfil(req, res);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE usuarios"),
                [null, null, null, null, null, null, null, 1],
                expect.any(Function)
            );

            expect(res.json).toHaveBeenCalledWith({
                mensagem: "Perfil atualizado com sucesso"
            });
        });

        test("deve retornar 500 se der erro ao atualizar perfil", () => {
            req.body = {
                altura: 1.75,
                peso: 70
            };

            db.query.mockImplementation((sql, params, callback) => {
                callback(new Error("Erro DB"));
            });

            atualizarPerfil(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao atualizar perfil"
            });
        });
    });

    describe("alterarSenha", () => {
        test("deve retornar 400 quando nova senha não for informada", async () => {
            req.body = {};

            await alterarSenha(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Informe a nova senha"
            });
        });

        test("deve alterar senha com sucesso", async () => {
            req.body = {
                novaSenha: "12345678"
            };

            bcrypt.hash.mockResolvedValue("senha_hash");

            db.query.mockImplementation((sql, params, callback) => {
                callback(null, { affectedRows: 1 });
            });

            await alterarSenha(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith(
                "12345678",
                10
            );

            expect(res.json).toHaveBeenCalledWith({
                mensagem: "Senha alterada com sucesso"
            });
        });

        test("deve retornar 404 quando usuário não existir", async () => {
            req.body = {
                novaSenha: "12345678"
            };

            bcrypt.hash.mockResolvedValue("senha_hash");

            db.query.mockImplementation((sql, params, callback) => {
                callback(null, {
                    affectedRows: 0
                });
            });

            await alterarSenha(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Usuário não encontrado"
            });
        });

        test("deve retornar 500 quando houver erro no banco", async () => {
            req.body = {
                novaSenha: "12345678"
            };

            bcrypt.hash.mockResolvedValue("senha_hash");

            db.query.mockImplementation((sql, params, callback) => {
                callback(new Error("Erro DB"));
            });

            await alterarSenha(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao alterar senha"
            });
        });

        test("deve retornar 500 quando bcrypt lançar exceção", async () => {
            req.body = {
                novaSenha: "12345678"
            };

            bcrypt.hash.mockRejectedValue(
                new Error("Erro bcrypt")
            );

            await alterarSenha(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro interno ao alterar senha"
            });
        });
    });

    describe("alterarEmail", () => {

        test("deve retornar 400 quando email não for informado", () => {

            req.body = {};

            alterarEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                erro: "Informe o novo e-mail"
            });

        });

        test("deve retornar 500 quando erro ao verificar email", () => {

            req.body = {
                novoEmail: "novo@email.com"
            };

            db.query.mockImplementation((sql, params, callback) => {

                callback(new Error("Erro DB"));

            });

            alterarEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({

                erro: "Erro ao verificar e-mail"

            });

        });

        test("deve retornar 409 quando email já existir", () => {

            req.body = {

                novoEmail: "novo@email.com"

            };

            db.query.mockImplementation((sql, params, callback) => {

                callback(null, [

                    {

                        id: 10

                    }

                ]);

            });

            alterarEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(409);

            expect(res.json).toHaveBeenCalledWith({

                erro: "Este e-mail já está em uso"

            });

        });

        test("deve retornar 500 quando erro ao atualizar email", () => {

            req.body = {

                novoEmail: "novo@email.com"

            };

            db.query

                .mockImplementationOnce((sql, params, callback) => {

                    callback(null, []);

                })

                .mockImplementationOnce((sql, params, callback) => {

                    callback(new Error("Erro DB"));

                });

            alterarEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({

                erro: "Erro ao alterar e-mail"

            });

        });

        test("deve retornar 404 quando usuário não existir", () => {

            req.body = {

                novoEmail: "novo@email.com"

            };

            db.query

                .mockImplementationOnce((sql, params, callback) => {

                    callback(null, []);

                })

                .mockImplementationOnce((sql, params, callback) => {

                    callback(null, {

                        affectedRows: 0

                    });

                });

            alterarEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(404);

            expect(res.json).toHaveBeenCalledWith({

                erro: "Usuário não encontrado"

            });

        });

        test("deve alterar email com sucesso", () => {

            req.body = {

                novoEmail: " NOVO@EMAIL.COM "

            };

            db.query

                .mockImplementationOnce((sql, params, callback) => {

                    callback(null, []);

                })

                .mockImplementationOnce((sql, params, callback) => {

                    callback(null, {

                        affectedRows: 1

                    });

                });

            alterarEmail(req, res);

            expect(res.json).toHaveBeenCalledWith({

                mensagem: "E-mail alterado com sucesso",

                email: "novo@email.com"

            });

        });

    });

    describe("excluirConta", () => {
        test("deve retornar 500 quando erro ao verificar usuário", () => {
            db.query.mockImplementationOnce((sql, params, callback) => {
                callback(new Error("Erro DB"), null);
            });

            excluirConta(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao verificar usuário"
            });
        });

        test("deve retornar 404 quando usuário não for encontrado", () => {
            db.query.mockImplementationOnce((sql, params, callback) => {
                callback(null, []);
            });

            excluirConta(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Usuário não encontrado"
            });
        });

        test("deve retornar 403 quando usuário for administrador", () => {
            db.query.mockImplementationOnce((sql, params, callback) => {
                callback(null, [{ is_admin: 1 }]);
            });

            excluirConta(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Administradores não podem excluir a própria conta."
            });
        });

        test("deve excluir conta com sucesso", () => {
            db.query
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{ is_admin: 0 }]);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null, { affectedRows: 1 });
                });

            excluirConta(req, res);

            expect(res.json).toHaveBeenCalledWith({
                mensagem: "Conta e todos os dados vinculados foram excluídos com sucesso"
            });
        });

        test("deve retornar 500 quando erro ao excluir séries", () => {
            db.query
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{ is_admin: 0 }]);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(new Error("Erro DB"));
                });

            excluirConta(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao excluir séries do usuário"
            });
        });

        test("deve retornar 500 quando erro ao excluir sessões", () => {
            db.query
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{ is_admin: 0 }]);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(new Error("Erro DB"));
                });

            excluirConta(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao excluir sessões do usuário"
            });
        });

        test("deve retornar 500 quando erro ao excluir treinos", () => {
            db.query
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{ is_admin: 0 }]);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(new Error("Erro DB"));
                });

            excluirConta(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao excluir treinos do usuário"
            });
        });

        test("deve retornar 500 quando erro ao excluir conta", () => {
            db.query
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{ is_admin: 0 }]);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(new Error("Erro DB"), null);
                });

            excluirConta(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro ao excluir conta"
            });
        });

        test("deve retornar 404 quando affectedRows for 0 ao excluir conta", () => {
            db.query
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{ is_admin: 0 }]);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                })
                .mockImplementationOnce((sql, params, callback) => {
                    callback(null, { affectedRows: 0 });
                });

            excluirConta(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Usuário não encontrado"
            });
        });
    });

    describe("buscarExerciciosExternos", () => {
        beforeEach(() => {
            global.fetch = jest.fn();
        });

        afterEach(() => {
            delete global.fetch;
        });

        test("deve retornar 400 quando busca não for informada", async () => {
            req.query = {};

            await buscarExerciciosExternos(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Informe o nome do exercício"
            });
        });

        test("deve retornar 400 quando busca estiver vazia", async () => {
            req.query = { busca: "   " };

            await buscarExerciciosExternos(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Informe o nome do exercício"
            });
        });

        test("deve retornar 502 quando API externa responder com erro", async () => {
            req.query = { busca: "bench" };

            global.fetch.mockResolvedValue({
                ok: false
            });

            await buscarExerciciosExternos(req, res);

            expect(res.status).toHaveBeenCalledWith(502);
            expect(res.json).toHaveBeenCalledWith({
                erro: "Erro na resposta da API externa"
            });
        });

        test("deve retornar exercícios filtrados com sucesso", async () => {
            req.query = { busca: "bench" };

            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    results: [
                        {
                            id: 1,
                            translations: [
                                {
                                    language: 2,
                                    name: "Bench press",
                                    description: "<p>Chest exercise</p>"
                                }
                            ],
                            category: {
                                name: "Chest"
                            },
                            muscles: [
                                {
                                    name: "Pectoralis major"
                                },
                                {
                                    name: "Triceps"
                                }
                            ],
                            images: [
                                {
                                    image: "imagem.jpg"
                                }
                            ]
                        },
                        {
                            id: 2,
                            translations: [
                                {
                                    language: 2,
                                    name: "Squat",
                                    description: "Leg exercise"
                                }
                            ],
                            category: {
                                name: "Legs"
                            },
                            muscles: [
                                {
                                    name: "Quadriceps femoris"
                                }
                            ],
                            images: []
                        }
                    ]
                })
            });

            await buscarExerciciosExternos(req, res);

            expect(res.json).toHaveBeenCalledWith({
                fonte: "API externa wger",
                total: 1,
                resultados: [
                    {
                        id: 1,
                        nome: "Bench press",
                        descricao: "Chest exercise",
                        categoria: "Peito",
                        musculos: "Peitoral maior, Tríceps",
                        imagem: "imagem.jpg"
                    }
                ]
            });
        });

        test("deve usar valores padrão quando dados vierem incompletos", async () => {
            req.query = { busca: "nome" };

            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    results: [
                        {
                            id: 99,
                            translations: [],
                            category: null,
                            muscles: [],
                            images: []
                        }
                    ]
                })
            });

            await buscarExerciciosExternos(req, res);

            expect(res.json).toHaveBeenCalledWith({
                fonte: "API externa wger",
                total: 1,
                resultados: [
                    {
                        id: 99,
                        nome: "Nome não informado",
                        descricao: "Sem descrição disponível.",
                        categoria: "Não informada",
                        musculos: "Não informado",
                        imagem: null
                    }
                ]
            });
        });

        test("deve retornar lista vazia quando nenhum exercício combinar com busca", async () => {
            req.query = { busca: "abcxyz" };

            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    results: [
                        {
                            id: 1,
                            translations: [
                                {
                                    language: 2,
                                    name: "Bench press",
                                    description: "Chest exercise"
                                }
                            ],
                            category: {
                                name: "Chest"
                            },
                            muscles: [
                                {
                                    name: "Pectoralis major"
                                }
                            ],
                            images: []
                        }
                    ]
                })
            });

            await buscarExerciciosExternos(req, res);

            expect(res.json).toHaveBeenCalledWith({
                fonte: "API externa wger",
                total: 0,
                resultados: []
            });
        });

        test("deve retornar 500 quando fetch lançar erro", async () => {
            req.query = { busca: "bench" };

            global.fetch.mockRejectedValue(new Error("Erro fetch"));

            await buscarExerciciosExternos(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: "A API externa demorou para responder. Tente novamente em alguns segundos."
            });
        });
    });
});