const Sequelize = require('sequelize');
const Promise = require('bluebird');

const tc = 100;
const qc = 10000;

const c = console.info;
const r = t => t[Math.floor(Math.random() * t.length)];
const d = _ => (new Date().getTime() - n.getTime()) / 1000;

if (process.argv.length == 2) {
  c(`Usage: ${__filename} [mysql|mssql] <host> <database> <username> <password>`);
  process.exit();
}

const dialect = process.argv[2];

const sequelize = new Sequelize(...process.argv.splice(4), {
  dialect,
  host: process.argv[3],
  logging: false,
  operatorsAliases: false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000
  },
  dialectOptions: {
    encrypt: dialect == 'mssql',
    supportBigNumbers: dialect == 'mssql'
  },
  define: {
    underscored: true,
    timestamps: true,
    paranoid: true
  }
});

const tables = Array.apply(null, { length: tc })
.map(Number.call, Number)
.map(n => sequelize.define(`t${n}`, {
  id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true }
}));

const funcs = [
  _ => r(tables).findAll(),
  _ => r(tables).create(),
  _ => r(tables).findOne({ order: sequelize.random() }).then(r => r ? r.delete() : Promise.resolve())
];

let prog = 0;
let n = new Date();

return sequelize.sync()
.then(_ => sequelize.truncate()).then(c('waiting for first query to complete'))
.then(_ => Promise.all(
  Array.apply(null, { length: qc }).map(_ => r(funcs)().then(_ => ++prog % 100 == 0 ? c(`completed ${prog} queries after ${d()} seconds`) : null))
))
.then(_ => c('task complete'))
.catch(e => c('an error occurred', e))
