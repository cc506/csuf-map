import mapboxgl from "mapbox-gl";
import ModelLayer from "./ModelLayer";
import "./styles.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYnJhdmVjb3ciLCJhIjoiY2o1ODEwdWljMThwbTJ5bGk0a294ZmVybiJ9.kErON3w2kwEVxU5aNa-EqQ";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v10",
  zoom: 16,
  center: [30.519895423204, 50.429234595753],
  pitch: 60,
  scrollZoom: false,
  antialias: true
});

map.on("load", () => {
  map.addControl(new mapboxgl.NavigationControl());
  map.addLayer(
    new ModelLayer({
      id: "layer-3d",
      url: "./model.glb",
      origin: [30.519551776681, 50.428953714395],
      altitude: 26.3,
      rotateY: 1,
      scale: 34.8
    })
  );
});
