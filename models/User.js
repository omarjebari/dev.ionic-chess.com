var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    service_provider_user_id: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    first_name: String,
    last_name: String,
    access_token: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('User', UserSchema);