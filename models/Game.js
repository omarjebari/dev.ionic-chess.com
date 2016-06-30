var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var GameSchema   = new Schema({
    game_data: { type: Schema.Types.Object, required: true },
    owner_id: { type: Schema.Types.ObjectId, required: true },
    white_id: { type: Schema.Types.ObjectId, required: true },
    black_id: { type: Schema.Types.ObjectId, required: true },
    user_to_move_id: { type: Schema.Types.ObjectId, required: true },
    finished: { type: Boolean }
});

module.exports = mongoose.model('Game', GameSchema);