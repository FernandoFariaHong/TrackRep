// Importa a função que calcula o volume total e o total de séries do treino
const { calcularResumoTreino } = require("../utils/treinoUtils");

// Importa funções auxiliares do sistema TrackRep
const {
  formatarEmail,
  podeExcluirConta,
  normalizarMedida,
  senhaFoiInformada,
  validarCadastro
} = require("../utils/trackrepUtils");

// ===============================
// TESTES UNITÁRIOS - TREINOS
// ===============================

describe("Resumo do treino", () => {
  test("deve calcular corretamente o volume total e o total de séries", () => {
    const exercicios = [
      {
        nome: "Supino",
        series: [
          { carga: 50, reps: 10 },
          { carga: 60, reps: 8 }
        ]
      },
      {
        nome: "Agachamento",
        series: [
          { carga: 80, reps: 10 }
        ]
      }
    ];

    const resultado = calcularResumoTreino(exercicios);

    expect(resultado.volumeTotal).toBe(1780);
    expect(resultado.totalSeries).toBe(3);
  });

  test("deve retornar zero quando a lista de exercícios estiver vazia", () => {
    const resultado = calcularResumoTreino([]);

    expect(resultado.volumeTotal).toBe(0);
    expect(resultado.totalSeries).toBe(0);
  });

  test("deve retornar zero quando receber null", () => {
    const resultado = calcularResumoTreino(null);

    expect(resultado.volumeTotal).toBe(0);
    expect(resultado.totalSeries).toBe(0);
  });

  test("deve tratar carga inválida como zero", () => {
    const exercicios = [
      {
        nome: "Rosca direta",
        series: [
          { carga: "abc", reps: 10 }
        ]
      }
    ];

    const resultado = calcularResumoTreino(exercicios);

    expect(resultado.volumeTotal).toBe(0);
    expect(resultado.totalSeries).toBe(1);
  });

  test("deve tratar repetições inválidas como zero", () => {
    const exercicios = [
      {
        nome: "Leg press",
        series: [
          { carga: 100, reps: null }
        ]
      }
    ];

    const resultado = calcularResumoTreino(exercicios);

    expect(resultado.volumeTotal).toBe(0);
    expect(resultado.totalSeries).toBe(1);
  });
});

// ===============================
// TESTES UNITÁRIOS - E-MAIL
// ===============================

describe("Formatação de e-mail", () => {
  test("deve converter e-mail para letras minúsculas", () => {
    expect(formatarEmail("FERNANDO@EMAIL.COM")).toBe("fernando@email.com");
  });

  test("deve remover espaços antes e depois do e-mail", () => {
    expect(formatarEmail("  teste@email.com  ")).toBe("teste@email.com");
  });

  test("deve remover espaços e converter para minúsculas ao mesmo tempo", () => {
    expect(formatarEmail("  FERNANDO@GMAIL.COM  ")).toBe("fernando@gmail.com");
  });

  test("deve retornar string vazia se o e-mail não for enviado", () => {
    expect(formatarEmail(null)).toBe("");
  });

  test("deve retornar string vazia se o valor não for texto", () => {
    expect(formatarEmail(123)).toBe("");
  });
});

// ===============================
// TESTES UNITÁRIOS - ADMINISTRADOR
// ===============================

describe("Regras de administrador", () => {
  test("deve impedir que administrador exclua a própria conta", () => {
    expect(podeExcluirConta(1)).toBe(false);
  });

  test("deve permitir que usuário comum exclua a própria conta", () => {
    expect(podeExcluirConta(0)).toBe(true);
  });

  test("deve considerar string '1' como administrador", () => {
    expect(podeExcluirConta("1")).toBe(false);
  });

  test("deve considerar string '0' como usuário comum", () => {
    expect(podeExcluirConta("0")).toBe(true);
  });
});

// ===============================
// TESTES UNITÁRIOS - PERFIL
// ===============================

describe("Validação de medidas corporais", () => {
  test("deve retornar null quando medida estiver vazia", () => {
    expect(normalizarMedida("")).toBeNull();
  });

  test("deve retornar null quando medida for undefined", () => {
    expect(normalizarMedida(undefined)).toBeNull();
  });

  test("deve retornar null quando medida for null", () => {
    expect(normalizarMedida(null)).toBeNull();
  });

  test("deve converter medida válida em texto para número", () => {
    expect(normalizarMedida("75.5")).toBe(75.5);
  });

  test("deve manter número válido como número", () => {
    expect(normalizarMedida(80)).toBe(80);
  });
});

// ===============================
// TESTES UNITÁRIOS - SENHA
// ===============================

describe("Validação de senha", () => {
  test("deve retornar true quando a senha for informada", () => {
    expect(senhaFoiInformada("123456")).toBe(true);
  });

  test("deve retornar false quando a senha estiver vazia", () => {
    expect(senhaFoiInformada("")).toBe(false);
  });

  test("deve retornar false quando a senha tiver apenas espaços", () => {
    expect(senhaFoiInformada("   ")).toBe(false);
  });

  test("deve retornar false quando a senha não for enviada", () => {
    expect(senhaFoiInformada(null)).toBe(false);
  });
});

// ===============================
// TESTES UNITÁRIOS - CADASTRO
// ===============================

describe("Validação de cadastro", () => {
  test("deve validar cadastro quando nome, e-mail e senha forem enviados", () => {
    expect(validarCadastro("Fernando", "fernando@email.com", "123456")).toBe(true);
  });

  test("deve invalidar cadastro sem nome", () => {
    expect(validarCadastro("", "fernando@email.com", "123456")).toBe(false);
  });

  test("deve invalidar cadastro sem e-mail", () => {
    expect(validarCadastro("Fernando", "", "123456")).toBe(false);
  });

  test("deve invalidar cadastro sem senha", () => {
    expect(validarCadastro("Fernando", "fernando@email.com", "")).toBe(false);
  });

  test("deve invalidar cadastro com campos contendo apenas espaços", () => {
    expect(validarCadastro("   ", "   ", "   ")).toBe(false);
  });
});