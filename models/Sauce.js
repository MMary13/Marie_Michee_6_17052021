const mongoose = require('mongoose');

const sauceSchema = mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true},
    manufacturer: { type: String, required: true},
    description: { type: String, required: true },
    mainPepper: { type: String, required: true},
    imageUrl: { type: String, required: true },
    heat: { type: Number, required: true, min: 1, max: 10 },
    likes: {type: Number, default: null},
    dislikes: {type: Number, default: null},
    usersLiked: {type: [String], default: null},
    usersDisliked: {type: [String], default: null}
});

module.exports = mongoose.model('Sauce', sauceSchema);