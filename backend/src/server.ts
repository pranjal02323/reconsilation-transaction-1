import cors from 'cors';
import express from 'express';
import { SERVER_CONFIG } from './Constants/app-constants';
import reconciliationRoutes from './Routes/reconciliation-routes';

const app = express();
const port = Number(process.env.PORT) || SERVER_CONFIG.DEFAULT_PORT;

app.use(cors());
app.use(express.json());
app.use(SERVER_CONFIG.API_PREFIX, reconciliationRoutes);

app.listen(port, () => {
  console.log(`Reconciliation API server running on port ${port}`);
});
