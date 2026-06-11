const calcularResumoTreino = (exercicios) => {
  if (!Array.isArray(exercicios) || exercicios.length === 0) {
    return {
      volumeTotal: 0,
      totalSeries: 0
    };
  }

  let volumeTotal = 0;
  let totalSeries = 0;

  exercicios.forEach((exercicio) => {
    const series = Array.isArray(exercicio.series) ? exercicio.series : [];

    series.forEach((serie) => {
      const carga = Number(serie.carga) || 0;
      const reps = Number(serie.reps) || 0;

      volumeTotal += carga * reps;
      totalSeries += 1;
    });
  });

  return {
    volumeTotal,
    totalSeries
  };
};

module.exports = {
  calcularResumoTreino
};