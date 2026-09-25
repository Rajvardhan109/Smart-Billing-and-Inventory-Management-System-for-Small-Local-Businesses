const pool = require('./config/db');
async function migrate() {
    await pool.query("ALTER TABLE users ADD COLUMN role ENUM('admin', 'cashier') DEFAULT 'admin'").catch(e=>console.log(e.message));
    await pool.query("ALTER TABLE users ADD COLUMN owner_id INT DEFAULT NULL").catch(e=>console.log(e.message));
    pool.end();
}
migrate();