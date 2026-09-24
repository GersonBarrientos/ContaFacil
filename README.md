# ContaFácil

Aplicación contable con Express y PostgreSQL administrado por Supabase.

## Configuración

1. Instala Node.js 22 o superior.
2. Instala dependencias:

   ```bash
   npm install
   ```

3. Copia `.env.example` a `.env`.
4. Define `SUPABASE_DB_URL` usando la conexión **Session pooler** de Supabase:

   ```env
   PORT=3000
   SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```

5. Ejecuta en Supabase SQL Editor las migraciones de `database/`.
6. Inicia la aplicación:

   ```bash
   npm start
   ```

La aplicación estará disponible en `http://localhost:3000`.

## Módulos

- Configuración de empresa.
- Administración de libros diarios por empresa.
- Registro de asientos por libro.
- Historial filtrable por libro.
- Mayorización por empresa, libro y período.

## Seguridad

El archivo `.env` está excluido del repositorio. Nunca publiques la contraseña de PostgreSQL ni credenciales de Supabase.
