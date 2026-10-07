# Mister Burguer — Fase 1
Requer Node 22.13+ (SQLite embutido, sem npm install).

    node server.js

- Cliente: http://localhost:3000   Admin: http://localhost:3000/admin
- No primeiro acesso ao /admin, o dono cria o e-mail e a senha. Abra o /admin logo após publicar.
- Banco: data.db (use disco persistente e faça backup). Use HTTPS em produção.
- Publicar (ex.: Render): Web Service, Start Command `node server.js`, disco persistente com a variável DB=/caminho/data.db.
