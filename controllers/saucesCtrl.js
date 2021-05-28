const Sauce = require('../models/Sauce');
const fs = require('fs');

//GET all sauces -------------------
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

//GET by ID -------------------------
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

//POST: create a new sauce -------------
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const newSauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    newSauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
        .catch(error => res.status(400).json({ error }));
};

//PUT: update a sauce---------
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body};
    if(req.file != null) {
      Sauce.findOne({_id: req.params.id})
        .then(sauce => {
          const oldFileName = sauce.imageUrl.split('/images/')[1]
          fs.unlink(`images/${oldFileName}`, () => {console.log('Fichier supprimé du serveur')});
        })
        .catch(error => res.status(400).json({ error }));
    }
    
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
      .catch(error => res.status(400).json({ error }));
};

//DELETE: file from server and sauce from DB---------
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce supprimée !'}))
        .catch(error => res.status(400).json({ error }));
      })
    })
    .catch(error => res.status(500).json({ error}));
  };

//POST: update likes or dislikes-----------------
exports.modifyLikes = (req, res, next) => {
  const userId = req.body.userId;
  const like = req.body.like;
  console.log("Like status : "+ like);
  Sauce.findOne({_id: req.params.id})
    .then(sauce => updateLikeOrDislike(sauce,userId,like,req,res))
    .catch(error => res.status(500).json({ error}));
};

//Method to update the data for a like or a dislike------------
function updateLikeOrDislike(sauce, userId, like,req,res) {
  const LIKE_STATUS = {
    '1': 'like',
    '0': 'none',
    '-1': 'dislike'
  };
  const status = LIKE_STATUS[like];
  switch (status) {
    case 'like':
      likeUpdate(req,res,sauce,userId);
      break;
    case 'none':
      undoLikeOrDislike(req,res,sauce,userId);
      break;
    case 'dislike':
      dislikeUpdate(req,res,sauce,userId)
      break;
    default:
      res.status(400).json({message : "La requête n'est pas correcte"});
      break;
  }
}

//Update data in DB to add the "like" to the Sauce---------------
function likeUpdate(req,res,sauce,userId) {
  //User like the sauce------
  console.log('User want to like');
  if(sauce.usersLiked.includes(userId)) {
    //Already like the sauce
    console.log('coucou');
    res.status(401).json({ error : 'Vous aimez dejà cette sauce!' });
  } else {
    //Update the fields for a like
    sauce.usersLiked.push(userId);
    sauce.likes = sauce.likes+1;
    if(sauce.usersDisliked.includes(userId)) { 
      sauce.usersDisliked.splice(sauce.usersDisliked.indexOf(userId),1);
      sauce.dislikes = sauce.dislikes-1;
    }
  }
  //Update in DB
  Sauce.updateOne({ _id: req.params.id }, { likes: sauce.likes, dislikes: sauce.dislikes, usersLiked:sauce.usersLiked, usersDisliked: sauce.usersDisliked})
    .then(() => res.status(200).json({ message: 'Sauce aimée !'}))
    .catch(error => {
      console.log(error);
      res.status(400).json({ error })
    });
}

//Update data in DB to undo "like" or "dislike" to the Sauce---------------
function undoLikeOrDislike(req,res,sauce,userId) {
  //User unlike or undislike the sauce-----
  if(sauce.usersLiked.includes(userId)) {
    //Remove the like
    sauce.usersLiked.splice(sauce.usersLiked.indexOf(userId),1);
    sauce.likes = sauce.likes-1;
  }
  if(sauce.usersDisliked.includes(userId)) {
    //Remove the dislike
    sauce.usersDisliked.splice(sauce.usersDisliked.indexOf(userId),1);
    sauce.dislikes = sauce.dislikes-1;
  }
  //Update data in DB
  Sauce.updateOne({ _id: req.params.id }, { likes: sauce.likes, dislikes: sauce.dislikes, usersLiked:sauce.usersLiked, usersDisliked: sauce.usersDisliked})
      .then(() => res.status(200).json({ message: 'Annulation du like ou dislike'}))
      .catch(error => {
        console.log(error);
        res.status(400).json({ error })
      });
}

//Update data in DB to add the "dislike" to the Sauce---------------
function dislikeUpdate(req,res,sauce,userId) {
   //User dislike the sauce------
   console.log('User want to dislike');
   if(sauce.usersDisliked.includes(userId)) {
     //Already dislike
     res.status(401).json({ error : "Vous n'aimez dejà pas cette sauce!" });
   } else {
     //Update the fields for a like
     sauce.usersDisliked.push(userId);
     sauce.dislikes = sauce.dislikes+1;
     if(sauce.usersLiked.includes(userId)) {
       sauce.usersLiked.splice(sauce.usersLiked.indexOf(userId),1);
       sauce.likes = sauce.likes-1;
      }
    }
     //Update data in DB
     Sauce.updateOne({ _id: req.params.id }, { likes: sauce.likes, dislikes: sauce.dislikes, usersLiked:sauce.usersLiked, usersDisliked: sauce.usersDisliked})
       .then(() => res.status(200).json({ message: 'Sauce pas aimée !'}))
       .catch(error => {
        console.log(error);
        res.status(400).json({ error })
      });
}

