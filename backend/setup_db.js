const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log("Waiting for Aiven DNS to propagate (this can take 2-5 minutes)...");
    
    let connection;
    while (!connection) {
        try {
            connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 10688,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME || 'defaultdb',
                ssl: { rejectUnauthorized: false },
                multipleStatements: true
            });
            console.log("Connected successfully to Aiven!");
        } catch (error) {
            console.log("Still waiting... (Error: " + error.message + ")");
            await new Promise(res => setTimeout(res, 10000)); // wait 10 seconds
        }
    }

    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log("Running schema.sql...");
        await connection.query(schemaSql);
        
        console.log("Database tables created successfully!");
        await connection.end();
    } catch (error) {
        console.error("Failed to run schema:", error);
    }
}

setupDatabase();
