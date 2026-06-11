const db = require("../../config/db");

jest.mock("../../config/db", () => ({
  query: jest.fn()
}));

const { dashboard, excluirUsuario } = require("../../controllers/adminController");

describe("adminController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      params: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test("dashboard deve retornar dados sem filtro", () => {
    req.query = {};

    db.query
      .mockImplementationOnce((sql, params, callback) => {
        callback(null, [
          {
            totalUsuarios: 2,
            totalTreinos: 5,
            treinosHoje: 1,
            volumeTotal: 1000
          }
        ]);
      })
      .mockImplementationOnce((sql, callback) => {
        callback(null, [{ id: 1, nome: "Admin", email: "admin@email.com", is_admin: 1 }]);
      })
      .mockImplementationOnce((sql, params, callback) => {
        callback(null, [{ id: 1, nome: "Fernando", volume_total: 500 }]);
      });

    dashboard(req, res);

    expect(res.json).toHaveBeenCalledWith({
      totalUsuarios: 2,
      totalTreinos: 5,
      treinosHoje: 1,
      volumeTotal: 1000,
      usuarios: [{ id: 1, nome: "Admin", email: "admin@email.com", is_admin: 1 }],
      treinos: [{ id: 1, nome: "Fernando", volume_total: 500 }]
    });
  });

  test("dashboard deve retornar erro ao buscar dados gerais", () => {
    db.query.mockImplementationOnce((sql, params, callback) => {
      callback(new Error("Erro"), null);
    });

    dashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: "Erro ao buscar dados gerais" });
  });

  test("dashboard deve retornar erro ao buscar usuários", () => {
    db.query
      .mockImplementationOnce((sql, params, callback) => {
        callback(null, [{ totalUsuarios: 1, totalTreinos: 1, treinosHoje: 1, volumeTotal: 1 }]);
      })
      .mockImplementationOnce((sql, callback) => {
        callback(new Error("Erro"), null);
      });

    dashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: "Erro ao buscar usuários" });
  });

  test("dashboard deve retornar erro ao buscar treinos", () => {
    db.query
      .mockImplementationOnce((sql, params, callback) => {
        callback(null, [{ totalUsuarios: 1, totalTreinos: 1, treinosHoje: 1, volumeTotal: 1 }]);
      })
      .mockImplementationOnce((sql, callback) => {
        callback(null, []);
      })
      .mockImplementationOnce((sql, params, callback) => {
        callback(new Error("Erro"), null);
      });

    dashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: "Erro ao buscar treinos" });
  });

  test("excluirUsuario deve bloquear exclusão da própria conta", () => {
    req.user.id = 1;
    req.params.id = 1;

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("excluirUsuario deve retornar 500 ao verificar usuário", () => {
    req.params.id = 2;

    db.query.mockImplementationOnce((sql, params, callback) => {
      callback(new Error("Erro"), null);
    });

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("excluirUsuario deve retornar 404 se usuário não existir", () => {
    req.params.id = 2;

    db.query.mockImplementationOnce((sql, params, callback) => {
      callback(null, []);
    });

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("excluirUsuario deve bloquear exclusão de administrador", () => {
    req.params.id = 2;

    db.query.mockImplementationOnce((sql, params, callback) => {
      callback(null, [{ is_admin: 1 }]);
    });

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("excluirUsuario deve excluir usuário com sucesso", () => {
    req.params.id = 2;

    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ is_admin: 0 }]))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null, { affectedRows: 1 }));

    excluirUsuario(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensagem: "Usuário excluído com sucesso."
    });
  });

  test("excluirUsuario deve retornar 500 ao excluir séries", () => {
    req.params.id = 2;

    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ is_admin: 0 }]))
      .mockImplementationOnce((sql, params, callback) => callback(new Error("Erro")));

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("excluirUsuario deve retornar 500 ao excluir sessões", () => {
    req.params.id = 2;

    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ is_admin: 0 }]))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(new Error("Erro")));

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("excluirUsuario deve retornar 500 ao excluir treinos", () => {
    req.params.id = 2;

    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ is_admin: 0 }]))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(new Error("Erro")));

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("excluirUsuario deve retornar 500 ao excluir usuário", () => {
    req.params.id = 2;

    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ is_admin: 0 }]))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(new Error("Erro"), null));

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("excluirUsuario deve retornar 404 se affectedRows for 0", () => {
    req.params.id = 2;

    db.query
      .mockImplementationOnce((sql, params, callback) => callback(null, [{ is_admin: 0 }]))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null))
      .mockImplementationOnce((sql, params, callback) => callback(null, { affectedRows: 0 }));

    excluirUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});