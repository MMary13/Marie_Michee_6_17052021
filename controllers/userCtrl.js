const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//Signup User method, use bcrypt to encrypt password--------
exports.signup = (req, res, next) => {
    if(userValidation(req.body,res)) {
        //Password encryption
        bcrypt.hash(req.body.password, 10)
        .then(hash => {
            //Create new user
            const user = new User({
                email: req.body.email,
                password: hash
            });
            //Save new User in DB
            user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));

        })
        .catch(error => res.status(500).json({ error }));
    } 
};

//Login User method, check the password and give a token access if OK-----------------
exports.login = (req, res, next) => {
User.findOne({email: req.body.email})
    .then(user => {
        if(!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé !'});
        }
        bcrypt.compare(req.body.password,user.password)
            .then(valid => {
                if(!valid) {
                    return res.status(401).json({ error: 'Mot de passe incorrect !'});
                }
                res.status(200).json({
                    userId: user._id,
                    token: jwt.sign(
                        {userId: user._id},
                        'RANDOM_TOKEN_SECRET',
                        {expiresIn: '24h'}
                    )
                });
            })
            .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

//User validation----------
function userValidation(user,res) {
    if(emailValidation(user.email)){
        if (passwordValidation(user.password)) {
            return true;
        } else {
            res.status(400).json({error : 'Votre mot de passe doit contenir au minimum 8 caractères, 1 majuscule, 1 minuscule, un chiffre et un caractère spécial.'})
            return false;
        }
    }else {
        res.status(400).json({error : "Votre email n'est pas correct, il doit être de la forme machin@bidule.truc"})
        return false;
    }
}

//Password validation-------
function passwordValidation(password){
    const pswdRegex =/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,30}$/;
    if (password.match(pswdRegex)) {
      return true;
    } else {
      return false;
    }
}

//Email validation--------
function emailValidation(email) {
    const emailRegex =/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (email.match(emailRegex)) {
      return true;
    } else {
      return false;
    }
}