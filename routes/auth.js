import Express, { request } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/users.js";
const routerAuth = Express.Router();
routerAuth.use((request, response, next) => {
  console.log(request.url + "--------" + Date.now());

  next();
});

routerAuth.route("/register").post(async (request, response) => {
  console.log(JSON.stringify(request.body) + " ----- " + Date.now());
  let user = new User({
    username: request.body.username,
    password: request.body.password,
    firstname: request.body.firstname,
    lastname: request.body.lastname,
    emailid: request.body.email,
  });
  try {
    const userNew = await user.save();
    response.send(userNew);
  } catch (err) {
    response.send(err);
  }
});
routerAuth.route("/verify").post(async (request, response) => {
  let [userid, upassword] = [request.body.uid, request.body.password];
  let user = await User.find({ uid: userid });

  if (user[0].uid == userid) {
    let result = await bcrypt.compare(upassword, user[0].password);
    if (result) response.send("Login successful!");
    else response.send("Login credentials incorrect!");
  } else {
    response.send("Login ID incorrect");
  }
});
export default routerAuth;
