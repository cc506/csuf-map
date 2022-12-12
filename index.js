var map, datasource, temp, popup, legend, arr;

var api = {
    count: 212,
    animation: true,
};
var model = {
    obj: "models/csuf.fbx",
    type: "fbx",
    scale: 1.6
};

function GetMap() {
    map = new atlas.Map("map", {
        center: [-117.8854, 33.8833],
        zoom: 14.7,
        pitch: 60,
        bearing: 130.8,
        showBuildingModels: true,

        // Add authentication details for connecting to Azure Maps.
        authOptions: {
            // Use Azure Active Directory authentication.
            authType: "anonymous",
            clientId: "180aa4ac-3e5c-4e3e-87f3-3783076bbcfb", // Your Azure Maps client id for accessing your Azure Maps account.
            getToken: function (resolve, reject, map) {
                // URL to your authentication service that retrieves an Azure Active Directory Token.
                var tokenServiceUrl =
                    "https://samples.azuremaps.com/api/GetAzureMapsToken";

                fetch(tokenServiceUrl)
                    .then((r) => r.text())
                    .then((token) => resolve(token));
            },

            // Use an Azure Maps key. Get an Azure Maps key at https://azuremaps.com/. NOTE: The primary key should be used as the key.
            authType: "subscriptionKey",
            subscriptionKey: "8Di0A_aTJ5-in5NE_RVwwVQY1SgBI7X0ol9UhlGOFS4",
        },
    });

    // Wait until the map resources are ready
    map.events.add("ready", function () {
        feature();
        //legend();
    });

    // Attach an event to capture when the map is moved
    map.events.add("moveend", function () {
        updateStatus();
    });

    updateStatus();

    let intMap = map.map;
    window.tb = new Threebox(
        intMap,
        intMap.getCanvas().getContext("webgl"), {
            defaultLights: true,
            enableSelectingObjects: false, //change this to false to disable 3D objects selection
            enableDraggingObjects: false, //change this to false to disable 3D objects drag & move once selected
            enableRotatingObjects: false, //change this to false to disable 3D objects rotation once selected
            enableTooltips: false, // change this to false to disable default tooltips on fill-extrusion and 3D models
        }
    );

    map.events.add("ready", function (e) {

        intMap.addLayer({
            id: "custom_layer",
            type: "custom",
            renderingMode: "3d",
            onAdd: function (map, context) {
                initMesh();
            },

            render: function (gl, matrix) {
                tb.update();
            },
        });
    }, 'points');
}

function initMesh() {
    let diff = api.count - tb.world.children.length;
    if (diff == 0) return;

    var options = {
        obj: model.obj,
        type: model.type,
        scale: model.scale,
        units: "meters",
        rotation: {
            x: 90,
            y: 90,
            z: 0
        },
        anchor: "center",
        cloned: true,
    };
    if (!processing) makeNaive(options, diff);
}

let processing = false;

function makeNaive(options, diff) {
    // Create a data source and add it to the map.
    var ds_map = new atlas.source.DataSource();
    console.log(ds_map)
    map.sources.add(ds_map);

    // Load some point data into the data source.
    ds_map.importDataFromUrl("map_locs.json").then(() => {
        processing = true;
        let j = 0;
        for (var i = 0; i < diff; i++) {
            tb.loadObj(options, function (model) {
                j++;

                let lng = ds_map.getShapeById(j).getCoordinates()[0];
                let lat = ds_map.getShapeById(j).getCoordinates()[1];
                let obj = model.setCoords([lng, lat, -20]);

                tb.add(obj);
            });
        }
        map.repaint = true;
    });
}

function updateStatus() {
    var camera = map.getCamera();
    var zoom = camera.zoom;
    var cp = camera.center;
    var pitch = camera.pitch;
    var bearing = camera.bearing;
    document.getElementById("status").innerHTML =
        "Zoom: " + zoom.toFixed(1) +
        " / Lon: " + cp[0].toFixed(5) +
        " / Lat: " + cp[1].toFixed(5) +
        " / Pitch: " + pitch.toFixed(1) +
        " / Bearing: " + bearing.toFixed(1);
}

function search() {
    popup.close();

    var query = document.getElementById('input').value;

    $.getJSON('locations.json', function (data) {
        return data.locations.findIndex(function (item, index) {
            if (item.title === query) {
                console.log(item.title, item.center.lat)
                temp.add(new atlas.data.Feature(new atlas.data.Point([item.center.lng, item.center.lat]), {
                    content: item.image,
                    "title": item.title,
                    "website": "http://www.fullerton.edu/housing/",
                }));
                console.log(temp)
            }

        })
    });
}

function feature() {
    datasource = new atlas.source.DataSource();
    map.sources.add(datasource);
    var marker;

    fetch('locations.json')
        .then(res => {
            if (!res.ok) {
                throw new Error("Error" + res.status)
            }
            return res.json();
        }).then(json => {

        }).catch(err => {
            console.log(err)
        });

    var pointLayer = new atlas.layer.SymbolLayer(datasource, null, {
        textOptions: {
            color: "#ebe5e5",
            haloColor: "#000000",
            haloWidth: 2.4,
            textField: ['get', 'title'], //Specify the property name that contains the text you want to appear with the symbol.
            offset: [0, 1.2]
        }
    });

    map.layers.add([pointLayer], 'points');

    //Add click events to the polygon and line layers.
    map.events.add('click', [pointLayer], featureClicked);

    //Create a popup but leave it closed so we can update it and display it later.
    popup = new atlas.Popup();

    // Add controls
    map.controls.add(
        [
            new atlas.control.ZoomControl(),
            new atlas.control.PitchControl(),
            new atlas.control.CompassControl(),
        ], {
            position: "top-right",
        }
    );
}

function featureClicked(e) {
    //Make sure the event occurred on a shape feature.
    console.log(e)
    if (e.shapes && e.shapes.length > 0) {
        //By default, show the popup where the mouse event occurred.
        var pos = e.position;
        var offset = [0, 0];
        var properties;

        properties = e.shapes[0].getProperties();

        //If the shape is a point feature, show the popup at the points coordinate.
        pos = e.shapes[0].getCoordinates();
        offset = [0, -18];

        //Update the content and position of the popup.
        popup.setOptions({
            //Create a table from the properties in the feature.
            content: atlas.PopupTemplate.applyTemplate(properties),
            position: pos,
            pixelOffset: offset
        });

        //Open the popup.
        popup.open(map);
    }
}