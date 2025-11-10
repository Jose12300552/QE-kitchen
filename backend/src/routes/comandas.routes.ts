import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// Obtener todas las comandas
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.*, m.numero as mesa_numero, u.nombre as usuario_nombre
      FROM comandas c
      LEFT JOIN mesas m ON c.mesa_id = m.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener comandas:', error);
    res.status(500).json({ error: 'Error al obtener comandas' });
  }
});

// Crear comanda
router.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { mesa_id, usuario_id, items, observaciones } = req.body;
    
    // Crear la comanda
    const comandaResult = await client.query(
      'INSERT INTO comandas (mesa_id, usuario_id, observaciones) VALUES ($1, $2, $3) RETURNING *',
      [mesa_id, usuario_id, observaciones]
    );
    
    const comanda = comandaResult.rows[0];
    let total = 0;
    
    // Insertar items
    for (const item of items) {
      const subtotal = item.cantidad * item.precio_unitario;
      total += subtotal;
      
      await client.query(
        'INSERT INTO comanda_items (comanda_id, producto_id, cantidad, precio_unitario, subtotal, observaciones) VALUES ($1, $2, $3, $4, $5, $6)',
        [comanda.id, item.producto_id, item.cantidad, item.precio_unitario, subtotal, item.observaciones]
      );
    }
    
    // Actualizar total de la comanda
    await client.query(
      'UPDATE comandas SET total = $1 WHERE id = $2',
      [total, comanda.id]
    );
    
    // Actualizar estado de la mesa
    await client.query(
      'UPDATE mesas SET estado = $1 WHERE id = $2',
      ['ocupada', mesa_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({ ...comanda, total });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear comanda:', error);
    res.status(500).json({ error: 'Error al crear comanda' });
  } finally {
    client.release();
  }
});

// Actualizar estado de comanda
router.patch('/:id/estado', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const result = await pool.query(
      'UPDATE comandas SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [estado, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comanda no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar comanda:', error);
    res.status(500).json({ error: 'Error al actualizar comanda' });
  }
});

export default router;