/**
 * Limites de la arquitectura por modulos. Sin esto las reglas dependen de que
 * alguien las recuerde en un code review; con esto las rompe el CI.
 */
module.exports = {
  forbidden: [
    {
      name: 'sin-internos-de-otro-modulo',
      comment:
        'Un modulo solo se importa por su index. Importar un archivo de adentro ata ' +
        'los dos modulos a un detalle privado que despues no se puede mover.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/([^/]+)/',
        pathNot: [
          '^src/modules/$1/',            // dentro del propio modulo, libre
          '^src/modules/[^/]+/index\\.ts$', // de otros, solo el index
        ],
      },
    },
    {
      name: 'core-no-conoce-el-negocio',
      comment:
        'core es puramente tecnico. Si necesita importar un modulo de dominio es que ' +
        'algo del negocio se filtro adentro y hay que sacarlo.',
      severity: 'error',
      from: { path: '^src/modules/core/' },
      to: { path: '^src/modules/(?!core/)' },
    },
    {
      name: 'los-modulos-no-conocen-la-app',
      comment:
        'app es la raiz de composicion y conoce a todos los modulos. Que un modulo ' +
        'importe de app invierte esa relacion y crea un ciclo.',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'sin-ciclos',
      comment: 'Una dependencia circular hace imposible razonar sobre el orden de carga.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'sin-huerfanos',
      comment: 'Archivo que nadie importa: o falta cablearlo, o quedo de algo que se borro.',
      severity: 'warn',
      from: { orphan: true, pathNot: ['\\.d\\.ts$', '(^|/)vite-env\\.d\\.ts$'] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
    exclude: { path: '(^|/)dist/' },
  },
}
