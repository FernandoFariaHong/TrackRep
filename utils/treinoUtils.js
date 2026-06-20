const calcularResumoTreino = (exercicios) => {
  if (!Array.isArray(exercicios) || exercicios.length === 0) {
    return {
      totalSeries: 0,
    };
  }

  const totalSeries = exercicios.reduce((total, exercicio) => {
    const series = Array.isArray(exercicio.series) ? exercicio.series : [];
    return total + series.length;
  }, 0);

  return {
    totalSeries,
  }
};

module.exports = {
  calcularResumoTreino,
};