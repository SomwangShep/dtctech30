if(process.env.NODE_ENV === 'production'){
  module.exports = {mongoURI: 'mongodb://root:pas123@ds231568.mlab.com:31568/java-prod'}
} else {
  module.exports = {mongoURI: 'mongodb://root:pas123@ds231568.mlab.com:31568/java-uat'}
}