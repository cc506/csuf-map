var map, datasource, temp, popup, legend, arr;

var api = {
    count: 1000
};
var model = {
    obj: "models/csuf.fbx",
    type: "fbx",
    scale: 1.6
};

var TOKEN = "8Di0A_aTJ5-in5NE_RVwwVQY1SgBI7X0ol9UhlGOFS4"
var mkr = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="30" height="37" viewBox="0 0 30 37" xml:space="preserve"><rect x="0" y="0" rx="8" ry="8" width="30" height="30" fill="{color}"/><polygon fill="{color}" points="10,29 20,29 15,37 10,29"/><text x="15" y="20" style="font-size:14px;font-family:arial;fill:#ffffff;" text-anchor="middle">{text}</text></svg>'

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
            subscriptionKey: TOKEN,
        },
    });

    // Wait until the map resources are ready
    map.events.add("ready", function () {
        datasource = new atlas.source.DataSource();
        map.sources.add(datasource);

        popup = new atlas.Popup()

        load();
        //legend();

        var markerLayer = new atlas.layer.HtmlMarkerLayer(datasource, null, {
            //Specify a callback to create custom markers.
            markerCallback: function (id, position, properties) {
                //Individual markers will be red.
                return new atlas.HtmlMarker({
                    position: position,
                    color: 'DodgerBlue',
                    text: properties.code,
                    htmlContent: mkr
                });
            }
        })

        //Add the marker layer to the map.
        map.layers.add(markerLayer);
        map.events.add('click', markerLayer, featureClicked);

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
    console.log(diff)
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

                }));
                console.log(temp)
            }

        })
    });
}

// function legend(){
//     legend = new atlas.control.LegendControl({
//                     //Global title to display for the legend.
//                     title: 'My Legend',

//                     //Hide the button to collapse the legend.
//                     showToggle: false,

//                     //All legend cards to display within the legend control.
//                     legends: [
//                        {
//                             type: 'category',
//                             subtitle: 'Category',
//                             layout: 'column',
//                             itemLayout: 'row',
//                             footer: 'A category legend that uses a combination of shapes and icons.',
//                             strokeWidth: 2,
//                             items: [
//                                 {
//                                     color: 'DodgerBlue',
//                                     label: 'label1',

//                                     //Url to an image.
//                                     shape: '/images/icons/campfire.png',
//                                     alt: 'Campfire'
//                                 }, {
//                                     color: 'Yellow',
//                                     label: 'label2',
//                                     shape: 'square'
//                                 }, {
//                                     color: 'Orange',
//                                     label: 'Ricky',
//                                     shape: 'line'
//                                 }, {
//                                     color: 'Red',
//                                     label: 'is',
//                                     shape: 'circle'
//                                 }, {
//                                     color: 'purple',
//                                     label: 'awesome!',
//                                     shape: 'triangle'
//                                 }
//                             ]
//                         }
//                     ]
//                 });

//                 //Add the legend control to the map.
//                 map.controls.add(legend, {
//                     position: 'bottom-left'
//                 });
//   }

function load() {

    $(function () {
        $.getJSON('locations.json', function (data) {
            $.each(data.locations, function (i, r) {
                datasource.add(new atlas.data.Feature(new atlas.data.Point([r.center.lng, r.center.lat]), {
                    "title": r.title,
                    "desc": r.description,
                    "code": r.buildingCode,
                    "department": r.departments,
                    "img": r.image,
                    "imgAlt": r.imageAlt
                }));
            });
        }).error(function () {
            console.log('error');
        });
    });
}

function featureClicked(e) {
    //Make sure the event occurred on a shape feature.
        console.log(e.target.properties.desc)
        //By default, show the popup where the mouse event occurred.
        var pos = e.target.getOptions().position;
        var offset = [0, -40];
        var div = e.target.properties.desc;

        //Update the content and position of the popup.
        popup.setOptions({
            //Create a table from the properties in the feature.
            content: div,
            position: pos,
            pixelOffset: offset
        });

        //Open the popup.
        popup.open(map);

}