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
    if(sauceValidation(sauceObject)) {
      delete sauceObject._id;
      const newSauce = new Sauce({
          ...sauceObject,
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      });
      newSauce.save()
          .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
          .catch(error => res.status(400).json({ error }));
    } else {
      res.status(400).json({ error : "Un des champs n'est pas renseigné correctement" });
    }
    
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
    if(sauceValidation(sauceObject)) {
      Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
      .catch(error => res.status(400).json({ error }));
    } else {
      res.status(400).json({ error : 'Un des champs de la requête est invalid'})
    }
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
  if(likeRequestValidation(req.body)) {
    const userId = req.body.userId;
    const like = req.body.like;
    console.log("Like status : "+ like);
    Sauce.findOne({_id: req.params.id})
      .then(sauce => updateLikeOrDislike(sauce,userId,like,req,res))
      .catch(error => res.status(500).json({ error}));
  } else {
    res.status(400).json({ error : 'Bad request'});
  }
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
      dislikeUpdate(req,res,sauce,userId);
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


//Functions for requests validation -----------------------------------------------------
//Request validation to create a sauce----------------------------
function sauceValidation(sauceRequest) {
  const nameIsValidated = stringValidation(sauceRequest.name);
  const manufacturerIsValidated = stringValidation(sauceRequest.manufacturer);
  const descriptionIsValidated = stringValidation(sauceRequest.description);
  const mainPepperIsValidated = stringValidation(sauceRequest.mainPepper);
  const heatIsValidated = heatValidation(sauceRequest.heat);
  if(nameIsValidated&&manufacturerIsValidated&&descriptionIsValidated&&mainPepperIsValidated&&heatIsValidated) {
    return true;
  } else {
    console.error("Un des champs n'est pas valide !")
    return false;
  }
}

//Validation for "string" fields---------------
function stringValidation(stringValue) {
  stringValue = stringValue.trim();
  if(typeof stringValue === 'string' || stringValue instanceof String) {
    for(let i=0 ; i<stringValue.length ; i++) {
      let asciiValue = stringValue.charCodeAt(i);
      if((asciiValue>=32 && asciiValue<=42) || (asciiValue>=43 && asciiValue<=63) || (asciiValue>=65 && asciiValue<=126)) {
      }else {
        //Caractère non valide
        console.error("Caractère non valide");
        return false;
      }
    }
    return true;
  } else {
    //Ce n'est pas une chaine de caractères
    return false;
  }
}

//Validation du champ heat--------------------- 
function heatValidation(heatValue) {
  if((heatValue>=1)&&(heatValue<=10)) {
    return true;
  } else {
    console.error("La valeur de piment est incorrecte")
    return false;
  }
}

//Validation request for a like------------
function likeRequestValidation(bodyRequest) {
  const userId = bodyRequest.userId;
  const likeStatus = bodyRequest.like;
  if((userId != null)&&(likeStatus>=-1 && likeStatus<=1)) {
    return true;
  } else {
    return false;
  }
}