     /*

    Promise.all([
      IOUtils.loadJSON('data/map/layers.json'),
      IOUtils.loadJSON('data/map/nodes.client.json')
    ])
    .spread(this.initMap.bind(this))
    .done(function(e) {
      this.initGroupsActivities();
      if (e) console.log(e);
    }.bind(this));

    this.initKeys();

    State.canvas = Crayon.createCanvas(this.width, 250);
    State.crayon = new Crayon(State.canvas);

    State.uiTexture = Texture2D.create(State.canvas.width, State.canvas.height);
    State.uiTexture.update(State.canvas);
    State.ui = new ScreenImage(State.uiTexture, 0, 0, State.canvas.width, State.canvas.height, this.width, this.height);
    */
    
 initGroupsActivities: function() {
    Promise.all([
      IOUtils.loadJSON('data/static/groups_bundle.json'),
      
    ])
    .spread(function(groups, activities) {
      this.initActivities(activities);
      var students = R.flatten(groups.map(R.prop('students')));
      var uniqueStudents = R.uniq(students.map(R.prop('id')));
      var programmes = R.uniq(R.flatten(groups.map(R.prop('programme'))));
      var groupNames = R.uniq(R.flatten(groups.map(R.prop('name'))));
      groupNames = R.uniq(groupNames.map(function(name) {
        return name.slice(0, 3);
      }))

      console.log('uniqueStudents.length', uniqueStudents.length)
    }.bind(this))
    .catch(function(e) {
      console.log(e.stack)
    })
  },
  initActivities: function(activities) {
    State.activities = activities;
    State.activtiesStart = new Date(activities[0].start);
    State.activtiesEnd = new Date(activities[activities.length-1].end);
    State.activtiesStartTime = State.activtiesStart.getTime();
    State.activtiesEndTime = State.activtiesEnd.getTime();
    State.activtiesLocations = [];
    var start = State.activtiesStart.getTime();
    var end = State.activtiesEnd.getTime();

    var c = State.crayon.canvas;
    State.crayon.clear(true);
    State.crayon.fill([255, 0, 0, 255]);
    for(var i=0; i<activities.length; i++) {
      var activity = activities[i];
      activity.startTime = new Date(activities[i].start).getTime();
      activity.endTime = new Date(activities[i].end).getTime();
      var location = activity.locations[0];
      var locationIndex = State.activtiesLocations.indexOf(location);
      if (locationIndex == -1) {
        locationIndex = State.activtiesLocations.length;
        State.activtiesLocations.push(location);
      }
      var s = remap(activity.startTime, State.activtiesStartTime, State.activtiesEndTime, 0, State.crayon.canvas.width);
      var e = remap(activity.endTime, State.activtiesStartTime, State.activtiesEndTime, 0, State.crayon.canvas.width);
      var y = 10 * DPI + locationIndex * 3 * DPI;
      State.crayon.rect(s, y, e - s - 2, 2 * DPI);
    }

    State.currentTime = State.activtiesStartTime;

    console.log('State.activtiesLocations', State.activtiesLocations);
    console.log('activities.length', activities.length)
    console.log('activities', State.activtiesStart + ' - ' + State.activtiesEnd)

    var usedRooms = [];
    var missingRooms = [];
    State.activtiesLocations.forEach(function(location) {
      var activityRoom = State.rooms.filter(R.where({ id : location}))
      if (activityRoom.length > 0) {
        usedRooms.push(location)
      }
      else {
        missingRooms.push(location);
      }
    })
    console.log('Used rooms', usedRooms)
    console.log('Missing rooms', missingRooms)

    State.uiTexture.update(State.crayon.canvas);
  },