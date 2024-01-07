import Express from "express";
import cors from "cors";
import routerAuth from "./routes/auth.js";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy } from "passport-local"; //localstrategy imported as strategy
import { User } from "./models/users.js";
import { Course } from "./models/courses.js";
import session from "express-session";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
// import bodyParser from "body-parser";
// import connectEnsureLogin from "connect-ensure-login";
const url = process.env.MONGODB_URI || "mongodb://localhost/lmsApp";
mongoose.connect(url, { useNewUrlParser: true });
const con = mongoose.connection;
con.on("open", function () {
  console.log("Mongo DB connected");
});
const app = Express();
const port = process.env.PORT || 3200;
const corsOptions = {
  origin: "https://learnonline.netlify.app",
  credentials: true,
};
app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: false,
      secure: false,
      maxAge: 60 * 60 * 24 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsOptions));
app.use(cookieParser("secret123"));
app.use(Express.json());
app.use(
  Express.urlencoded({
    extended: true,
  })
);
app.set("trust proxy", 1);

app.use("/auth", routerAuth);
passport.use(
  new Strategy(function (username, password, done) {
    try {
      User.findOne({ username: username }, function (err, user) {
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
  console.log("Deserializing: " + user);
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
              res.send(user);
            }
          });
        }
      }
    })(req, res, next);
  })
  .get(async function (req, res) {
    console.log("Login");
    res.send({ message: "Done" });
  });
app.get(
  "/dashboard",
  cors(corsOptions),
  // connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    for (let session in req.sessionStore.sessions) {
      let data = JSON.parse(req.sessionStore.sessions[session]);

      if (data.authenticated) {
        res.send(data.passport.user);
      } else res.send(false);
    }
    // if (req.isAuthenticated()) console.log("yes");
    // else console.log("no");
    // console.log(req.session.authenticated);
    console.log(req.user);
    // res.send({ sessionID: req.sessionID });
  }
);
app.put("/incrementchapter", async (req, res) => {
  let data = req.body;
  let userID = data.userID;
  let courseID = data.courseID;
  let currentID = data.currentChapterID;
  let toset = null;
  try {
    Course.findOne({ _id: courseID })
      .then((dataCourses) => {
        let chapters = dataCourses.chapters;
        if (currentID + 1 < chapters.length) toset = currentID + 1;
        else toset = currentID;
        User.updateOne(
          { _id: userID },
          {
            $set: {
              "coursesEnrolled.ids.$[inner].startFromChapter": toset,
            },
          },
          {
            arrayFilters: [{ "inner.course": courseID }],
          }
        )
          .then((data2) => res.send({ DoneInsert: data2 }))
          .catch((err) => res.err({ message: err }));
      })
      .catch((err) => res.err({ message: err }));
  } catch (err) {
    res.send({ message: err });
  }
});
app.post("/newcourse", async (req, res) => {
  let data = req.body;
  let course = new Course(data);
  course
    .save()
    .then((d) => res.send(d))
    .catch((err) => console.log(err));
});
app.post("/courses", async (req, res) => {
  let courseIDs = req.body;

  let returnData = [];

  courseIDs.ids.forEach((courseID, i, courseIDs) => {
    Course.find({ _id: courseID })
      .then((data) => {
        if (data.length > 0) {
          returnData.push(data[0]);
          if (i == courseIDs.length - 1) res.send(returnData);
        }
      })
      .catch((err) => {
        console.log(err);
        if (i == courseIDs.length - 1) res.send(returnData);
      });
  });
});
app.post("/enroll", async (req, res) => {
  let data = req.body;
  console.log("Enroll request: " + JSON.stringify(data));
  let userID = data.id;
  let course = { course: data.courseID };
  User.updateOne(
    { _id: userID },
    {
      $push: { "coursesEnrolled.ids": course },
    }
  )
    .then((data) => {
      res.send(data);
    })
    .catch((err) => res.err(err));
});
app.post("/tutor", async (req, res) => {
  let id = req.body._id;
  User.updateOne({ _id: id }, { $set: { isTutor: true } })
    .then((data) => res.send(data))
    .catch((err) => res.err(err));
});
app.get("/courses", async (req, res) => {
  let returnData = [];
  try {
    Course.find({}).then((data) => {
      data.forEach((course) => {
        let t = {};
        t.id = course._id;
        t.image = course.image;
        t.title = course.title;
        t.description = course.description;
        returnData.push(t);
      });
      res.send(returnData);
    });
  } catch (err) {
    console.log(err);
  }
});
app.get("/", async (request, response) => {
  response.send("Hello world!");
});
app.get("/logout", async (request, response) => {
  request.logout();
  request.sessionStore.sessions = {};
  console.log(request);
  response.send({ message: "Logged Out!" });
});
app.listen(port, () => console.log("Started at port " + port));
