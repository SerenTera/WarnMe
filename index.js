/*
Reference List
HuntingZoneIDs: Bluebox-1023 | Caiman-1023 | crabs-6553782 | mongos seems to be dependent on location, are the zone ids the same as orignal location?
Template IDs: Bluebox-88888888 | Caiman-99999999,99999991,99999992 | crabs-1021 | unknown for mongos

To discover more ids, hook S_SPAWN_NPC and check huntingzoneid and templateId. Or use 'mob-id-finder' module on my Github (SerenTera)
*/
	
//Defaults:
let	enabled=true, 		//default enabling of module (default true)
	markenabled=true,   //default enabling of markers (default true)
	messager=false, 	//default enabling of system chat message (default false)
	alerted=true		//default enabling of system notice (default true)
	
//Monster ids and other values:
const mobzone = [4587701],	//huntingzoneid of mob
	mobtemplate = [2015],	//template ids of mobs
	itemid = 98260,			//ItemId for the marker, Use different itemids if you feel like it.
	custommsg = 'Bluebox' 	//change custom message for the item here
	
//------------------------------------All defaults and changeable values are above this line------------------------------------------------------------------//

const Command = require('command')

module.exports = function markmob(dispatch) {
	const command = Command(dispatch)

	let	mobid=[]
	
	///////Commands
	command.add('warntoggle',() => {
		enabled=!enabled
		command.message( enabled ? '(Warnme) Module Enabled' : '(Warnme) Module Disabled')
		
		if(!enabled)
			for(let itemid of mobid) despawnthis(itemid)
	})
	
	command.add('warnalert',() => {
		alerted = !alerted
		command.message(alerted ? '(Warnme)System popup notice enabled' : '(Warnme)System popup notice disabled')
	})
	
	command.add('warnmarker',() => {
		markenabled = !markenabled
		command.message(markenabled ? '(Warnme)Item Markers enabled' : '(Warnme)Item Markers disabled')
	})
	
	command.add('warnclear',() => {
		command.message('(Warnme)Item Markers Clear Attempted')
		for(let itemid of mobid) despawnthis(itemid)
	})
	
	
	////////Dispatches
	dispatch.hook('S_SPAWN_NPC', 3, event => {
		if(enabled && mobzone.includes(event.huntingZoneId) && mobtemplate.includes(event.templateId)) { 
			if(markenabled) {
				markthis(event.x,event.y,event.z,event.id.low), // low is enough, seems like high are all the same values anyway
				mobid.push(event.id.low)
			}
			
			if(alerted) notice('Found '+custommsg)
			
			if(messager) command.message('(Warnme)Found '+custommsg)
		}
	}) 

	dispatch.hook('S_DESPAWN_NPC', 1, event => {
		if(mobid.includes(event.target.low)) {
			despawnthis(event.target.low),
			mobid.splice(mobid.indexOf(event.target.low),1)
		}
	})
	
	dispatch.hook('S_LOAD_TOPO',1, event => { //reset mobid list on location change
		mobid=[]
	})
	
	
	////////Functions
	function markthis(locationx,locationy,locationz,idRef) {
		dispatch.toClient('S_SPAWN_DROPITEM', 1, {
			id: {low:idRef,high:0,unsigned:true},
			x: locationx,
			y: locationy,
			z: locationz,
			item: itemid, 
			amount: 1,
			expiry: 300000, //expiry time,milseconds (300000=5 mins?)
			owners: [{id: 0}]
		})
	}
	
	function despawnthis(despawnid) {
		dispatch.toClient('S_DESPAWN_DROPITEM', 1, {
			id: {low:despawnid,high:0,unsigned:true}
		})
	}
	
	function notice(msg) {
		dispatch.toClient('S_DUNGEON_EVENT_MESSAGE', 1, {
            unk1: 2,
            unk2: 0,
            unk3: 0,
            message: '(Proxy)' + msg
        })
    }
}

