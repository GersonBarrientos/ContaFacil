DROP FUNCTION IF EXISTS public.balance_comprobacion(BIGINT, BIGINT, DATE, DATE);

CREATE OR REPLACE FUNCTION public.balance_comprobacion(
    p_id_empresa BIGINT,
    p_id_libro BIGINT,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    codigo_cuenta TEXT,
    nombre_cuenta TEXT,
    sumas_debe NUMERIC,
    sumas_haber NUMERIC,
    saldo_deudor NUMERIC,
    saldo_acreedor NUMERIC,
    es_total BOOLEAN,
    cuadra BOOLEAN
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
    -- 1. Validación: Asegurar que el libro existe y pertenece a la empresa
    IF NOT EXISTS (
        SELECT 1 FROM libros_diarios 
        WHERE id_libro = p_id_libro AND id_empresa = p_id_empresa
    ) THEN
        RAISE EXCEPTION 'El libro especificado no existe o no pertenece a la empresa' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Retornar los saldos calculados + la fila de totales
    RETURN QUERY
    WITH por_cuenta AS (
        -- Agrupa por cuenta principal y redondea a 2 decimales directamente
        SELECT 
            codigo_cuenta,
            cuenta_principal AS nombre_cuenta,
            ROUND(SUM(debe), 2) AS sumas_debe,
            ROUND(SUM(haber), 2) AS sumas_haber
        FROM vw_historial_asientos
        WHERE id_libro = p_id_libro
          AND fecha <= p_fecha_fin
          AND (p_fecha_inicio IS NULL OR fecha >= p_fecha_inicio)
        GROUP BY codigo_cuenta, cuenta_principal
    ),
    filas AS (
        -- Calcula el saldo deudor o acreedor usando greatest para evitar negativos
        SELECT 
            por_cuenta.codigo_cuenta,
            por_cuenta.nombre_cuenta,
            por_cuenta.sumas_debe,
            por_cuenta.sumas_haber,
            GREATEST(por_cuenta.sumas_debe - por_cuenta.sumas_haber, 0::NUMERIC) AS saldo_deudor,
            GREATEST(por_cuenta.sumas_haber - por_cuenta.sumas_debe, 0::NUMERIC) AS saldo_acreedor
        FROM por_cuenta
    )
    -- Consulta principal: Las filas de cada cuenta
    SELECT 
        filas.codigo_cuenta,
        filas.nombre_cuenta,
        filas.sumas_debe,
        filas.sumas_haber,
        filas.saldo_deudor,
        filas.saldo_acreedor,
        FALSE AS es_total,
        NULL::BOOLEAN AS cuadra
    FROM filas
    
    UNION ALL
    
    -- Segunda consulta: Agrega una única fila con los totales de todo el balance
    SELECT 
        NULL::TEXT AS codigo_cuenta,
        'TOTALES'::TEXT AS nombre_cuenta,
        COALESCE(SUM(filas.sumas_debe), 0) AS sumas_debe,
        COALESCE(SUM(filas.sumas_haber), 0) AS sumas_haber,
        COALESCE(SUM(filas.saldo_deudor), 0) AS saldo_deudor,
        COALESCE(SUM(filas.saldo_acreedor), 0) AS saldo_acreedor,
        TRUE AS es_total,
        (COALESCE(SUM(filas.saldo_deudor), 0) = COALESCE(SUM(filas.saldo_acreedor), 0)) AS cuadra
    FROM filas
    
    -- Orden: Primero las filas normales (es_total = false), luego los totales (es_total = true)
    ORDER BY 7, 1;

END;
$$;
