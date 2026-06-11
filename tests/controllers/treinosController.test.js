const db = require("../../config/db");

jest.mock("../../config/db", () => ({
  query: jest.fn()
}));

const controller = require("../../controllers/treinosController");

describe("treinosController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      body: {},
      params: {}
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

  test("listarTreinos deve retornar treinos", () => {
    const treinos = [{ id: 1, exercicio: "Supino" }];

    db.query.mockImplementation((sql, params, callback) => {
      callback(null, treinos);
    });

    controller.listarTreinos(req, res);

    expect(res.json).toHaveBeenCalledWith(treinos);
  });

  test("listarTreinos deve retornar 500 em erro", () => {
    db.query.mockImplementation((sql, params, callback) => {
      callback(new Error("Erro"), null);
    });

    controller.listarTreinos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: "Erro ao buscar treinos" });
  });

  test("cadastrarTreino deve cadastrar treino", () => {
    req.body = {
      exercicio: "Supino",
      carga: 50,
      repeticoes: 10,
      series: 3,
      data: "2026-06-11"
    };

    db.query.mockImplementation((sql, params, callback) => {
      callback(null, { insertId: 10 });
    });

    controller.cadastrarTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: "Treino cadastrado",
      id: 10
    });
  });

  test("cadastrarTreino deve retornar 500 em erro", () => {
    req.body = {
      exercicio: "Supino",
      carga: 50,
      repeticoes: 10,
      series: 3,
      data: "2026-06-11"
    };

    db.query.mockImplementation((sql, params, callback) => {
      callback(new Error("Erro"), null);
    });

    controller.cadastrarTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: "Erro ao cadastrar treino" });
  });

  test("listarSessoesTreino deve retornar sessões agrupadas", () => {
    const linhas = [
      {
        sessao_id: 1,
        data_treino: "2026-06-11",
        volume_total: 1000,
        total_series: 2,
        exercicio: "Supino",
        total_series_exercicio: 2
      }
    ];

    db.query.mockImplementation((sql, params, callback) => {
      callback(null, linhas);
    });

    controller.listarSessoesTreino(req, res);

    expect(res.json).toHaveBeenCalledWith([
      {
        id: 1,
        data_treino: "2026-06-11",
        volume_total: 1000,
        total_series: 2,
        exercicios: [
          {
            nome: "Supino",
            total_series: 2
          }
        ]
      }
    ]);
  });

  test("listarSessoesTreino deve retornar 500 em erro", () => {
    db.query.mockImplementation((sql, params, callback) => {
      callback(new Error("Erro"), null);
    });

    controller.listarSessoesTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: "Erro ao buscar sessões de treino"
    });
  });

  test("salvarSessaoTreino deve retornar 400 sem exercícios", () => {
    req.body = { exercicios: [], data: "2026-06-11" };

    controller.salvarSessaoTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: "Nenhum exercício enviado" });
  });

  test("salvarSessaoTreino deve salvar sessão com sucesso", () => {
    req.body = {
      data: "2026-06-11",
      exercicios: [
        {
          nome: "Supino",
          series: [
            { carga: 50, reps: 10 },
            { carga: 60, reps: 8 }
          ]
        }
      ]
    };

    db.query
      .mockImplementationOnce((sql, params, callback) => {
        callback(null, { insertId: 5 });
      })
      .mockImplementationOnce((sql, params, callback) => {
        callback(null);
      });

    controller.salvarSessaoTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: "Sessão de treino salva com sucesso",
      sessaoId: 5,
      volumeTotal: 980,
      totalSeries: 2
    });
  });

  test("salvarSessaoTreino deve retornar 500 se erro ao salvar sessão", () => {
    req.body = {
      data: "2026-06-11",
      exercicios: [{ nome: "Supino", series: [{ carga: 50, reps: 10 }] }]
    };

    db.query.mockImplementationOnce((sql, params, callback) => {
      callback(new Error("Erro"), null);
    });

    controller.salvarSessaoTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: "Erro ao salvar sessão de treino"
    });
  });

  test("salvarSessaoTreino deve retornar 500 se erro ao salvar séries", () => {
    req.body = {
      data: "2026-06-11",
      exercicios: [{ nome: "Supino", series: [{ carga: 50, reps: 10 }] }]
    };

    db.query
      .mockImplementationOnce((sql, params, callback) => {
        callback(null, { insertId: 5 });
      })
      .mockImplementationOnce((sql, params, callback) => {
        callback(new Error("Erro"));
      });

    controller.salvarSessaoTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: "Erro ao salvar séries do treino"
    });
  });

  test("deletarTreino deve deletar treino", () => {
    req.params.id = 1;

    db.query.mockImplementation((sql, params, callback) => {
      callback(null, { affectedRows: 1 });
    });

    controller.deletarTreino(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensagem: "Treino deletado" });
  });

  test("deletarTreino deve retornar 404 se treino não existir", () => {
    req.params.id = 999;

    db.query.mockImplementation((sql, params, callback) => {
      callback(null, { affectedRows: 0 });
    });

    controller.deletarTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("deletarTreino deve retornar 500 em erro", () => {
    req.params.id = 1;

    db.query.mockImplementation((sql, params, callback) => {
      callback(new Error("Erro"), null);
    });

    controller.deletarTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("deletarSessaoTreino deve deletar sessão", () => {
    req.params.id = 1;

    db.query.mockImplementation((sql, params, callback) => {
      callback(null, { affectedRows: 1 });
    });

    controller.deletarSessaoTreino(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensagem: "Sessão de treino deletada"
    });
  });

  test("deletarSessaoTreino deve retornar 404 se sessão não existir", () => {
    req.params.id = 999;

    db.query.mockImplementation((sql, params, callback) => {
      callback(null, { affectedRows: 0 });
    });

    controller.deletarSessaoTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("deletarSessaoTreino deve retornar 500 em erro", () => {
    req.params.id = 1;

    db.query.mockImplementation((sql, params, callback) => {
      callback(new Error("Erro"), null);
    });

    controller.deletarSessaoTreino(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});