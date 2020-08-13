let ret = null

function main() {
  const update = require('./app/update')
  const workLoop = require('./app/work-loop')

  clearInterval(ret)
  ret = setInterval(workLoop(update), 3000)
}

require('dotenv').config()
main()

if (process.env.NODE_ENV !== 'production') {
  const chokidar = require('chokidar')

  //Set up watcher to watch all files in ./server/app
  const watcher = chokidar.watch('./app')

  watcher.on('ready', function () {
    //On any file change event
    //You could customise this to only run on new/save/delete etc
    //This will also pass the file modified into the callback
    //however for this example we aren't using that information
    watcher.on('all', function () {
      console.log('Reloading server...')
      //Loop through the cached modules
      //The "id" is the FULL path to the cached module
      Object.keys(require.cache).forEach(function (id) {
        //Get the local path to the module
        const localId = id.substr(process.cwd().length)

        //Ignore anything not in server/app
        if (!localId.match(/^\/app\//)) return

        //Remove the module from the cache
        delete require.cache[id]
      })
      main()
      console.log('Server reloaded.')
    })
  })
}
