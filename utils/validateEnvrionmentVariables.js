function validateEnvironmentVariables(opts){
  for(var key in opts){
    if(!opts[key]){
      throw new Error(`Missing required environment variable ${key}`);
    }
  }
}

module.exports = validateEnvironmentVariables;