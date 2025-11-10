import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, testConnection } from './config/database';

// Importar rutas
import usuariosRoutes from './routes/usuarios.routes';
import productosRoutes from './routes/productos.routes';
import mesasRoutes from './routes/mesas.routes';
import comandasRoutes from './routes/comandas.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Ruta de salud
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Kitchen Flow Backend - Quinta Estación',
    timestamp: new Date().toISOString()
  });
});

// Test de base de datos
app.get('/api/db-test', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'Conexión a PostgreSQL exitosa',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al conectar con PostgreSQL',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/comandas', comandasRoutes);

// Iniciar servidor
const startServer = async () => {
  // Probar conexión a la base de datos
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.error('❌ No se pudo conectar a la base de datos. Verifica tu configuración.');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Kitchen Flow corriendo en http://localhost:${PORT}`);
    console.log(`📊 Frontend URL: ${process.env.FRONTEND_URL}`);
  });
};

startServer();