const jwt = require("jsonwebtoken");
const authMiddleware = require("../../middlewares/authMiddleware");

jest.mock("jsonwebtoken");

describe("authMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
    process.env.JWT_SECRET = "segredo_teste";
  });

  test("deve retornar 401 quando token não for enviado", () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: "Token não fornecido" });
    expect(next).not.toHaveBeenCalled();
  });

  test("deve retornar 401 quando token for inválido", () => {
    req.headers.authorization = "Bearer token_invalido";

    jwt.verify.mockImplementation(() => {
      throw new Error("Token inválido");
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: "Token inválido" });
    expect(next).not.toHaveBeenCalled();
  });

  test("deve chamar next quando token for válido", () => {
    req.headers.authorization = "Bearer token_valido";

    const decoded = { id: 1, email: "teste@email.com" };

    jwt.verify.mockReturnValue(decoded);

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("token_valido", "segredo_teste");
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
  });
});