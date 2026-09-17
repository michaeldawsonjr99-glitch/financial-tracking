const Database = require("better-sqlite3");
const db = new Database("C:/Users/gabfo/Desktop/opencoderist/dev.db");

const migrate = db.transaction(() => {
  const userName = db.prepare('select email from "User" limit 1').get();
  console.log("user before:", userName);

  db.prepare('delete from "PaymentLog"').run();
  db.prepare('delete from "ShoppingLoan"').run();
  db.prepare('delete from "PersonalLoan"').run();

  const s = db.prepare('select count(*) as c from "ShoppingLoan"').get();
  const p = db.prepare('select count(*) as c from "PersonalLoan"').get();
  console.log("after clear -> shopping:", s.c, "personal:", p.c);
});

migrate();
db.close();
console.log("done");