const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pokemonsSchema = new Schema({
    name: String,
    type: String,
}, { versionKey: false });

module.exports = mongoose.model("pokemons", pokemonsSchema);