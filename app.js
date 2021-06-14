const express = require('express');
const mongoose = require('mongoose');
const app = express();
const saucesRoutes = require('./routes/saucesRouter');
const userRoutes = require('./routes/userRouter');
const path = require('path');

//Database connexion-------------------
mongoose.connect('mongodb+srv://pekocko-user:root@cluster0.3feu0.mongodb.net/soPekockoDatabase?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

//Middleware CORS, to add correct headers--------------
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
  });  

//Cookies security--------------------------
app.use((req,res,next) => {
  res.cookie('superCookie', '1', { expires: new Date(Date.now() + 3*3600000), httpOnly: true });
  next();
});


app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/sauces', saucesRoutes);
app.use('/api/auth', userRoutes);
module.exports = app;