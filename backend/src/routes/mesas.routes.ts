import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// Obtener todas las mesas
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM mesas ORDER BY numero');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({ error: 'Error al obtener mesas' });
  }
});

// Actualizar estado de mesa
router.patch('/:id/estado', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const result = await pool.query(
      'UPDATE mesas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    res.status(500).json({ error: 'Error al actualizar mesa' });
  }
});

export default router;
