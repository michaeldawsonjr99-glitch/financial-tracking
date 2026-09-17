const Database = require("better-sqlite3");
const db = new Database("C:/Users/gabfo/Desktop/opencoderist/dev.db", { readonly: true });
const tables = db.prepare("select name from sqlite_master where type='table'").all();
for (const r of tables) {
  const c = db.prepare("select count(*) as c from [" + r.name + "]").get();
  console.log(r.name, c.c);
}
for (const name of ["ShoppingLoan", "PersonalLoan"]) {
  const cols = db.prepare("pragma table_info([" + name + "])").all();
  console.log(name + " :: " + cols.map((x) => x.name + ":" + x.type + (x.notnull ? "!" : "")).join(", "));
}
const vals = db.prepare('select distinct type from "PersonalLoan"').all();
console.log("PL types:", JSON.stringify(vals));
const money = db.prepare("pragma table_info([Bill])").all();
console.log("BILL cols:", JSON.stringify(money.map((x) => x.name)));