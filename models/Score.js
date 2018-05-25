const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ScoreSchema = new Schema({
  chapter:{
    type: Number,
    required: true
  },
  user:{
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  score:{
    type: Number,
    required: true
  },
  outOf:{
    type: Number,
    required: true
  },  
  quizzes: [{
    quiz: {
      type: String,
      required: true
    },
    usrAns: {
      type: String
    },
    chk: {
      type: String,
      required: true      
    }
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('scores', ScoreSchema);