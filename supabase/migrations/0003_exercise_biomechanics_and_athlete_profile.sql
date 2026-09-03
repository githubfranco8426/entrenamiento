-- Detalle Biomecánico del Ejercicio (design/stitch-redesign/10-detalle-biomecanico)
alter table exercises
  add column cues text[],
  add column biomechanics_notes text;

-- Ficha Clínica & Perfil del Atleta (design/stitch-redesign/11-ficha-clinica-perfil)
alter table user_settings
  add column injury_history text,
  add column medical_notes text;
