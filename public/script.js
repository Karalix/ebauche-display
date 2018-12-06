var db = new PouchDB('display');
//var remoteCouch = 'http://admin:admin@localhost:5984/ebauche'


window.webstrateUrl = 'https://webstrates.cs.au.dk'
var display
var storyId = ''
var storyDisplayListener
var current = 0

window.addEventListener('message', (event) => {
  if(event.data === 'canvas-loaded') {
    document.querySelector('#sketch-iframe').contentWindow.postMessage('display-canvas','*')
  }
})

function syncError (err) {
  console.error(err)
}

async function dbsync () {
  //let remoteCouch = await (await fetch('/couchdbURL')).text()
  let remoteCouch = 'https://pareadedgeratillookofted:4b7d6d39311f1e821dc147547713f759e37b9b8c@fb0eb9b0-18ca-4ff4-9f10-fa884cac1f61-bluemix.cloudant.com/ebauche'
  let opts = {live: true, retry: true}
  db.replicate.to(remoteCouch, opts, syncError)
  db.replicate.from(remoteCouch, opts, syncError)
}

function startStoryDisplayListener () {
  storyDisplayListener = db.changes({
    since: 'now',
    live: true,
    doc_ids: [`${storyId}`],
    include_docs: true
  }).on('change', (change) => {
    current = change.doc.current
    document.querySelector('#sketch-iframe').src = `${window.webstrateUrl}/${change.doc.sketches[change.doc.current]}`
  })
}

window.onkeydown = (e) => {
  let key = e.keyCode ? e.keyCode : e.which
  if(key == 112 || key == 13) {
    e.preventDefault()
    document.querySelector('#story-id-div').classList.toggle('invisible')
  }
}

document.querySelector('#story-id-input').addEventListener('keyup',(e) => {
  let value = document.querySelector('#story-id-input').value
  if( value.length != 0){
    display.storyId = value
    storyId = value
    db.put(display, (err, resp) => {if(!err){display._rev = resp.rev}})
    storyDisplayListener.cancel()
    startStoryDisplayListener()
  }
})

document.querySelector('#surface-glass').addEventListener('click', (e) => {
  db.get(`${storyId}`, (err, doc) => {
    if(!err) {
      let newIndex = doc.current + 1
      if (newIndex >= doc.sketches.length) {
        newIndex = 0
      }
      doc.current = newIndex
      db.put(doc, (err, resp) => { if(err){console.error(err)}})
    }
  })
})

let displayUID = localStorage.getItem('displayUID')

if(!displayUID) {
  displayUID = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36)
  localStorage.setItem('displayUID', displayUID)
}


dbsync()

function setupDisplay (doc) {
  display = doc
  storyId = doc.storyId
  startStoryDisplayListener()
  document.querySelector('#story-id-input').value = display.storyId
  //Update last alive time every minute
  setInterval(() => {
    display.lastUpdate = Date.now()
    db.put(display, (err, resp) => {if(!err){display._rev = resp.rev}})
  }, 60000)
}

db.get(displayUID, (err, doc) => {
    if(!err) {
      setupDisplay(doc)
    } else {
      //If display didn't exist in DB
      db.put({
        storyId: Math.floor(Math.random() * Math.floor(1000)),
        _id: displayUID,
        type: 'display'
      }, (err, resp) => {
        if(err) {
          console.log(err)
        }
        if(resp.ok) {
          db.get(displayUID, (err, doc) => {
            if(!err) {
              setupDisplay(doc)
            } else {
              console.log(err)
            }
          })
        }
      })
    }
  }
)

var hammertime = new Hammer(document.body);
hammertime.get('pinch').set({ enable: true });
hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });

let scale = 1
let xOffset = 0
let yOffset = 0


hammertime.on('hammer.input', (ev) => {
  
  if(ev.pointers.length > 1){
    document.body.style.transform = `scale(${ev.scale}) translateX(${xOffset+ev.deltaX}px) translateY(${yOffset+ev.deltaY}px)`
    scale = ev.scale
  } else {
    document.body.style.transform = `scale(${scale}) translateX(${xOffset+ev.deltaX}px) translateY(${yOffset+ev.deltaY}px)`
  }
  
  
  if(ev.isFinal){
    xOffset += ev.deltaX
    yOffset += ev.deltaY
  }
})