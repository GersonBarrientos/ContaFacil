# ContaFácil

Aplicación contable con Express, PostgreSQL y Supabase.

## Configuración local

1. Instala Node.js 22 o superior.
2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Copia `.env.example` a `.env`.
4. En el panel de Supabase, abre **Connect > Session pooler** y copia la cadena
   PostgreSQL a `DATABASE_URL`. El pooler es la opción recomendada cuando el
   entorno no tiene conectividad IPv6. La conexión directa `db.<project>.supabase.co`
   solo debe usarse si tu servidor tiene IPv6 funcional.

   Para este proyecto la cadena tiene esta estructura:

   ```env
   DATABASE_URL=postgresql://postgres.eggtsiiyhowjsoyhthrd:TU_PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```

   La contraseña de la base de datos solo debe existir en el backend y nunca debe
   publicarse en el frontend.

5. Ejecuta el contenido de [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) en el SQL Editor de Supabase.
6. Carga el catálogo inicial de `cuentas_principales` y `subcuentas`.
7. Inicia la aplicación:

   ```bash
   npm start
   ```

La aplicación quedará disponible en `http://localhost:3000`.

## Persistencia

El backend usa el driver `pg` con conexión SSL al pooler PostgreSQL de Supabase. La función PostgreSQL
`guardar_asiento_completo` valida y guarda cada asiento dentro de una operación
transaccional. Las tablas tienen restricciones para impedir detalles con ambos
lados, importes negativos y referencias a subcuentas inexistentes.
