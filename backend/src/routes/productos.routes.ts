import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// Obtener todos los productos
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Crear producto
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, precio, categoria_id, disponible, imagen_url } = req.body;
    
    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria_id, disponible, imagen_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, descripcion, precio, categoria_id, disponible, imagen_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

export default router;