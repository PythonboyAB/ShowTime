import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   fullname: {type: String, required: true},
   username: {type: String, required: true},
   email: {
      type: String,
      required: true,
      unique: true
   },
   phone: {type: String, required: true},
   birthDate: {type: String, required: true},
   password: {type: String, required: true}
}, {
   timestamps: true


});
 const User = mongoose.models.user || mongoose.model('User',userSchema);
 export default User;
 