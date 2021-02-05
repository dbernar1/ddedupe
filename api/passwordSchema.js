const PasswordValidator = require("password-validator");

const passwordSchema = new PasswordValidator();

passwordSchema.is().min(8).has().uppercase().has().lowercase().has().digits();

module.exports = passwordSchema;
