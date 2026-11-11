// Datas do Plano de Avaliações, sempre como "YYYY-MM-DD" (o mesmo formato do campo
// data das avaliações). As contas são feitas em UTC para não variarem com o fuso.

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function paraData(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

function paraIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function somarDias(iso: string, dias: number) {
  const d = paraData(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return paraIso(d);
}

/** Segunda-feira da semana a que o dia pertence. */
export function segundaDaSemana(iso: string) {
  const diaSemana = paraData(iso).getUTCDay(); // 0 = domingo
  return somarDias(iso, diaSemana === 0 ? -6 : 1 - diaSemana);
}

export function hojeIso() {
  return paraIso(new Date());
}

/** Segundas-feiras das semanas que tocam no mês ("YYYY-MM"). */
export function semanasDoMes(mes: string) {
  const primeiro = `${mes}-01`;
  const [ano, m] = mes.split("-").map(Number);
  const ultimo = paraIso(new Date(Date.UTC(ano, m, 0)));
  const semanas: string[] = [];
  for (let s = segundaDaSemana(primeiro); s <= ultimo; s = somarDias(s, 7)) semanas.push(s);
  return semanas;
}

export function mesAnterior(mes: string, delta = -1) {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, m - 1 + delta, 1));
  return paraIso(d).slice(0, 7);
}

/** Ex.: "3–9 nov" ou "27 out – 2 nov". */
export function rotuloSemana(segunda: string) {
  const ini = paraData(segunda);
  const fim = paraData(somarDias(segunda, 6));
  if (ini.getUTCMonth() === fim.getUTCMonth()) {
    return `${ini.getUTCDate()}–${fim.getUTCDate()} ${MESES[fim.getUTCMonth()]}`;
  }
  return `${ini.getUTCDate()} ${MESES[ini.getUTCMonth()]} – ${fim.getUTCDate()} ${MESES[fim.getUTCMonth()]}`;
}

/** Ex.: "qua, 12 nov". */
export function rotuloDia(iso: string) {
  const d = paraData(iso);
  return `${DIAS_SEMANA[d.getUTCDay()]}, ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}
