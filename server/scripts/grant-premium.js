// Usage: npm run grant-premium -- someone@gmail.com        (add "off" as 2nd arg to revoke)
const db = require('../db');
const [email, mode] = process.argv.slice(2);
if (!email) { console.error('Usage: npm run grant-premium -- email@example.com [off]'); process.exit(1); }
const r = db.prepare('UPDATE users SET premium = ? WHERE lower(email) = lower(?)').run(mode === 'off' ? 0 : 1, email);
console.log(r.changes ? `Premium ${mode === 'off' ? 'removed from' : 'granted to'} ${email}` : 'No user with that email (they must sign in once first).');
