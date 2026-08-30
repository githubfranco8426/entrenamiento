-- Miniatura y video/enlace de ejecución por ejercicio (referencia externa, cargada por el usuario;
-- no se generan ni infieren automáticamente para no mostrar una técnica incorrecta como si fuera validada).

alter table exercises
  add column thumbnail_url text,
  add column video_url text;
