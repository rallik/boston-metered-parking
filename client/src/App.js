import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker';
import 'mapbox-gl/dist/mapbox-gl.css';
import './site.scss'

const KEY = process.env.REACT_APP_MB_KEY;

const Map = () => {
    const mapContainer = useRef();
    const [lng, setLng] = useState(-71.0589);
    const [lat, setLat] = useState(42.3601);
    const [zoom, setZoom] = useState(9);

    useEffect(() => {
        const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [lng, lat],
        zoom: zoom
        });
        return () => map.remove();
        }, []);
        
    return (
        <div className="map-container" ref={mapContainer}></div>
    );

}


const App = () => {
    mapboxgl.workerClass = MapboxWorker;
    mapboxgl.accessToken = KEY;


    return (
        <React.Fragment>
            <Map/>
        </React.Fragment>
    )
}

export default App
