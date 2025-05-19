const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const orderRoutes = require('./routes/routes');

// Middleware untuk parsing JSON
app.use(bodyParser.json());

// Menggunakan rute untuk order
app.use('/api', orderRoutes);

// Menjalankan server di port yang diinginkan
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
