import Express from "express";
import cors from "cors";
import routerAuth from "./routes/auth.js";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy } from "passport-local"; //localstrategy imported as strategy
import { User } from "./models/users.js";
import session from "express-session";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import connectEnsureLogin from "connect-ensure-login";
const url = process.env.MONGODB_URI || "mongodb://localhost/lmsApp";
mongoose.connect(url, { useNewUrlParser: true });
const con = mongoose.connection;
con.on("open", function () {
  console.log("Mongo DB connected");
});
const app = Express();
const port = process.env.PORT || 3200;
const corsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors());
app.use(cookieParser("secret123"));
app.use(Express.json()); // 2
app.use(
  Express.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      sameSite: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", routerAuth);
passport.use(
  new Strategy(function (username, password, done) {
    try {
      User.findOne({ username: username }, function (err, user) {
        // console.log("Found..........." + err + " " + user);
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        bcrypt.compare(password, user.password, (err, result) => {
          console.log("result=" + result);
          if (err) return done(err);
          if (result === true) {
            console.log("Found user");
            return done(null, user);
          } else return done(null, false, { message: "Incorrect password." });
        });
        // return done(null, user);
      });
    } catch (err) {
      done(err);
    }
  })
);
passport.serializeUser((user, done) => {
  console.log("Serialized: " + user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log(
    "DESERIALIZINGGGGGGGGGGGGGGGGGGGGG>....................................."
  );
  User.findOne(user, (err, user) => {
    if (err) {
      console.log("error: " + err);
      done(null, false, { error: err });
    } else {
      console.log("User::" + user);
      done(null, user);
    }
  });
});
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", ["*"]);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type",
    "Accept",
    "x-requested-with"
  );
  res.header("Access-Control-Request-Headers", "Content-Type");
  next();
});
app
  .route("/login")
  .post(async (req, res, next) => {
    passport.authenticate("local", { session: true }, (err, user, info) => {
      console.log("It is: " + err + " " + user + " " + JSON.stringify(info));
      if (err) res.err(err);
      else {
        if (!user) {
          res.send(info);
        } else {
          console.log("Yes!");
          // req.session ? console.log("...") : (req.session = {});
          req.session.messages = "Login successfull";
          req.session.authenticated = true;
          req.authenticated = true;
          req.logIn(user, (err) => {
            if (err) {
              res.send("Error in logging in...");
            } else {
              console.log("Authenticated " + req.user);
              res.send({ message: "Authenticated!" });
            }
          });
        }
      }
    })(req, res, next);
  })
  .get(async function (req, res) {
    console.log("HIIIIIIIIIIII");
    res.send({ message: "Done" });
  });
app.get(
  "/dashboard",
  cors(corsOptions),
  // connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log(req);
    for (let session in req.sessionStore.sessions) {
      let data = JSON.parse(req.sessionStore.sessions[session]);
      console.log(data.authenticated);
      if (data.authenticated) {
        console.log(data.passport.user.coursesEnrolled.ids);
      }
    }
    // if (req.isAuthenticated()) console.log("yes");
    // else console.log("no");
    // console.log(req.session.authenticated);
    console.log(req.user);
    res.send({ sessionID: req.sessionID });
  }
);

app.get("/", async (request, response) => {
  response.send("Hello world4");
});

app.listen(port, () => console.log("Started at port " + port));
