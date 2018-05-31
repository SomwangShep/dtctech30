const express = require('express');
const path = require('path');
const exphbs  = require('express-handlebars');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const {ensureAuthenticated} = require('./helpers/auth');

const app = express();

// Load Models
require('./models/User');
require('./models/Idea');
require('./models/Score');
const Score = mongoose.model('scores');

// Load routes
const ideas = require('./routes/ideas');
const users = require('./routes/users');
const scores = require('./routes/scores');

// Passport Config
require('./config/passport')(passport);

//-------------------------------------------------
// DB Config
const db = require('./config/database');
// Map global promise - get rid of warning
mongoose.Promise = global.Promise;
// Connect to mongoose
mongoose.connect(db.mongoURI, {
  useMongoClient: true
})
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));
//-------------------------------------------------

// Handlebars Middleware
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware
app.use(methodOverride('_method'));

// Express session midleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Global variables
app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Index Route
app.get('/', (req, res) => {
  const title = 'Welcome';
  res.render('index', {
    title: title
  });
});

// About Route
app.get('/about', (req, res) => {
  res.render('about');
});

app.get("/chapter/:n",ensureAuthenticated,function(req, res){
    var ch = req.params.n;
     res.render(`chapters/${ch}`);
});

// Use routes
app.use('/ideas', ideas);
app.use('/users', users);
app.use('/quizzes', scores);

/*====================================================================
                            start quiz
====================================================================*/
var loop = 10;//set # of quiz
// var qr = "";//this is raw data return for Java, this is the one that saving to DB
var rawData = [];//it seem to be th eissue with qr get cut off, this is the tmp varible

var i = -1;//quiz count
var score = 0;//cout of correct answer

var qs = [];//varible
var hea = [];//question string?
var javAns = [];//answer -1
var prt = [];//pritn statement -2
var usrAns = [];//this varible keep the answer from the user
var chk = [];//This varible to store correct/incorrect

var spawn = require('child-process-promise').spawn;
var fn = __dirname + '/public/Quiz1.jar';

app.get('/quiz1', (req, res)=>
{
  var va = "";//keep varible in each questions  
  var t = 0;// this varible just temp to keep the index bec i will not increase until 'Next' button
  t = i + 1;
  
  // =============== Start execute java file =========================//
  var promise = spawn('java', ['-jar',fn]);
  var childProcess = promise.childProcess;

  // console.log(`****************************************************************`);
  childProcess.stdout.on('data', function (data)
  {
    // i = i + 1;
    // console.log(`i: ${i}`);
    var qr = data.toString();
    rawData[t] = qr;//this saving in db
    // console.log(qr);
    qr = qr.split(";");
    
    hea[t] = qr[0].trim();
    prt[t] = qr[qr.length-2].trim() + ";";
    var s = qr[qr.length-1].trim();
    javAns[t] = s.substring(1,s.length-1);//take off ~ the begining and the end`
    
    /*-----------------------------------------------------
    //varible
    //if qr length = 3 then no varible(?, print, ans)
    ------------------------------------------------------*/
    if(qr.length > 3)
    {
      for (var j=0; j < qr.length - 3; j++)
      {
        var tmp = qr[j+1].trim() + ";";
        va = va +"<br>"+ tmp ;
      }      
    }
    else {
      va = "<br>";
    }
    qs[t] = va;
  });

  childProcess.stderr.on('data', function (data)
  {
    console.log('[spawn] stderr: ', data.toString());
  });
  promise.then(function ()
  {
    //this is where we need to do something after return form Java
    // ----------- Start Render form -------------------------------
    res.render('quizzes/quiz', {
      cnt: `${t + 1}`,
      hea: `${hea[t]}`,
      qs: `${qs[t]}`,
      prt: `${prt[t]}`
    });
    // ----------- End Render form -------------------------------
    // console.log("Complete!");
  })
  .catch(function (err)
  {
    console.error('[spawn] ERROR: ', err);
  });
});

/*=======================================================================
        Next button
Save answer, one hit 10 it will display solution, then save to database
reset score,i varible
========================================================================*/
app.post('/quiz1',(req,res) => {
  i = i + 1;
  usrAns[i] = req.body.ans;
  // console.log(`Answer: ${usrAns[i]}`);
  
  if (usrAns[i] == javAns[i])
  {
    chk[i] = "Correct";
    score = score + 1;
  } else {
    chk[i] = "Incorrect";
  }
  
  if (i < loop - 1)  {
    res.redirect('back');
  } else {
    res.render('quizzes/quizAns', {
        hea: `${hea[0]}`,
          qs: `${qs[0]}`,
        prt: `${prt[0]}`,
      javAns: `${javAns[0]}`,
      usrAns: `${usrAns[0]}`,
        chk: `${chk[0]}`,
         
        hea1: `${hea[1]}`,
        qs1: `${qs[1]}`,
        prt1: `${prt[1]}`,
    javAns1: `${javAns[1]}`,
    usrAns1: `${usrAns[1]}`,
        chk1: `${chk[1]}`,
        
        hea2: `${hea[2]}`,
        qs2: `${qs[2]}`,
        prt2: `${prt[2]}`,
    javAns2: `${javAns[2]}`,
    usrAns2: `${usrAns[2]}`,
        chk2: `${chk[2]}`,
        
        hea3: `${hea[3]}`,
        qs3: `${qs[3]}`,
        prt3: `${prt[3]}`,
    javAns3: `${javAns[3]}`,
    usrAns3: `${usrAns[3]}`,
        chk3: `${chk[3]}`,
        
        hea4: `${hea[4]}`,
        qs4: `${qs[4]}`,
        prt4: `${prt[4]}`,
    javAns4: `${javAns[4]}`,
    usrAns4: `${usrAns[4]}`,
        chk4: `${chk[4]}`,
        
        hea5: `${hea[5]}`,
        qs5: `${qs[5]}`,
        prt5: `${prt[5]}`,
    javAns5: `${javAns[5]}`,
    usrAns5: `${usrAns[5]}`,
        chk5: `${chk[5]}`,
        
        hea6: `${hea[6]}`,
        qs6: `${qs[6]}`,
        prt6: `${prt[6]}`,
    javAns6: `${javAns[6]}`,
    usrAns6: `${usrAns[6]}`,
        chk6: `${chk[6]}`,
        
        hea7: `${hea[7]}`,
        qs7: `${qs[7]}`,
        prt7: `${prt[7]}`,
    javAns7: `${javAns[7]}`,
    usrAns7: `${usrAns[7]}`,
        chk7: `${chk[7]}`,
        
        hea8: `${hea[8]}`,
        qs8: `${qs[8]}`,
        prt8: `${prt[8]}`,
    javAns8: `${javAns[8]}`,
    usrAns8: `${usrAns[8]}`,
        chk8: `${chk[8]}`,
        
        hea9: `${hea[9]}`,
        qs9: `${qs[9]}`,
        prt9: `${prt[9]}`,
    javAns9: `${javAns[9]}`,
    usrAns9: `${usrAns[9]}`,
        chk9: `${chk[9]}`,
        
      score: `${score}`,
        cnt: `${i+1}`
    });
    /*-----------------------------
          saving data
    ------------------------------*/
    const newQ = [{
      quiz:`${rawData[0]}`,
      usrAns: `${usrAns[0]}`,
      chk: `${chk[0]}`
    },{
      quiz:`${rawData[1]}`,
      usrAns: `${usrAns[1]}`,
      chk: `${chk[1]}`     
    },{
      quiz:`${rawData[2]}`,
      usrAns: `${usrAns[2]}`,
      chk: `${chk[2]}`  
    },{
      quiz:`${rawData[3]}`,
      usrAns: `${usrAns[3]}`,
      chk: `${chk[3]}`  
    },{
      quiz:`${rawData[4]}`,
      usrAns: `${usrAns[4]}`,
      chk: `${chk[4]}`
    },{
      quiz:`${rawData[5]}`,
      usrAns: `${usrAns[5]}`,
      chk: `${chk[5]}`    
    },{
      quiz:`${rawData[6]}`,
      usrAns: `${usrAns[6]}`,
      chk: `${chk[6]}`   
    },{
      quiz:`${rawData[7]}`,
      usrAns: `${usrAns[7]}`,
      chk: `${chk[7]}`  
    },{
      quiz:`${rawData[8]}`,
      usrAns: `${usrAns[8]}`,
      chk: `${chk[8]}`  
    },{
      quiz:`${rawData[9]}`,
      usrAns: `${usrAns[9]}`,
      chk: `${chk[9]}`       
    }];
    const newScore = {
      chapter: 1,
      score: `${score}`,
      outOf: `${loop}`,
      user: req.user.id,
      quizzes: newQ
    };
    new Score(newScore)
      .save()
      .then(Score => {
      });
    
    //reset varible
    i = -1;
    score = 0;
  }//end else
});
// ======================= End quiz ========================

const port = process.env.PORT || 5000;

app.listen(port, () =>{
  console.log(`Server started on port ${port}`);
});