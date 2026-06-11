const db = require("../../config/db");
const adminMiddleware = require("../../middlewares/adminMiddleware");

jest.mock("../../config/db", () => ({
  query: jest.fn()
}));

describe("adminMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test("deve retornar 500 em erro no banco", () => {
    db.query.mockImplementation((sql, params, callback) => {
      callback(new Error("Erro DB"), null);
    });

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: "Erro ao verificar permissão de administrador"
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("deve retornar 404 quando usuário não existir", () => {
    db.query.mockImplementation((sql, params, callback) => {
      callback(null, []);
    });

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      erro: "Usuário não encontrado"
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("deve retornar 403 quando usuário não for admin", () => {
    db.query.mockImplementation((sql, params, callback) => {
      callback(null, [{ is_admin: 0 }]);
    });

    adminMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      erro: "Acesso negado. Apenas administradores podem acessar."
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("deve chamar next quando usuário for admin", () => {
    db.query.mockImplementation((sql, params, callback) => {
      callback(null, [{ is_admin: 1 }]);
    });

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});