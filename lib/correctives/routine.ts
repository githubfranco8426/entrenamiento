import type { Prescription } from "./model";

export const lumbarRoutine: Prescription[] = [
  {
    exercise: "basculacion-pelvica",
    sets: 1,
    repsMin: 6,
    repsMax: 8,
    rir: 4,
    rest: 30,
    tempo: "2-1-2-0",
  },
  {
    exercise: "deslizamiento-talon",
    sets: 1,
    repsMin: 6,
    repsMax: 8,
    rir: 4,
    rest: 45,
    tempo: "3-0-3-0",
  },
  {
    exercise: "puente",
    sets: 1,
    repsMin: 8,
    repsMax: 10,
    rir: 4,
    rest: 45,
    tempo: "2-2-2-0",
  },
  {
    exercise: "bird-dog-corto",
    sets: 1,
    repsMin: 5,
    repsMax: 6,
    rir: 4,
    rest: 45,
    tempo: "2-2-2-0",
  },
];
export const lumbarGuides: Record<
  string,
  { cue: string; easier: string; perSide: boolean }
> = {
  "basculacion-pelvica": {
    cue: "Boca arriba, rodillas flexionadas. Alterna pequeñas inclinaciones de pelvis, exhalando al llevarla hacia atrás. Busca un punto medio cómodo; no aprietes la espalda contra el suelo a la fuerza.",
    easier: "Reduce el recorrido y mantén la respiración natural.",
    perSide: false,
  },
  "deslizamiento-talon": {
    cue: "Boca arriba, rodillas flexionadas. Desliza un talón lentamente y vuelve, alternando lados. Mantén las costillas relajadas y evita que la pelvis se mueva al alargar la pierna.",
    easier: "Acorta el deslizamiento; deja ambos brazos apoyados.",
    perSide: true,
  },
  puente: {
    cue: "Apoya ambos pies y eleva la pelvis hasta donde puedas sin arquear más la zona lumbar. Empuja desde los pies, mantén dos segundos y baja con control, respirando.",
    easier:
      "Eleva menos la pelvis o practica primero la contracción de glúteos sin despegarla.",
    perSide: false,
  },
  "bird-dog-corto": {
    cue: "En cuatro apoyos, desliza un pie hacia atrás manteniendo los dedos en el suelo. Evita girar la pelvis o arquear la espalda. Regresa y alterna lados; no hace falta elevar brazo y pierna a la vez.",
    easier:
      "Mueve la pierna menos distancia y conserva siempre el apoyo del pie.",
    perSide: true,
  },
};
