import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker';
import Map from './components/Map'
import 'mapbox-gl/dist/mapbox-gl.css';
import './site.scss';

const KEY = process.env.REACT_APP_MB_KEY;

const App = () => {
    mapboxgl.workerClass = MapboxWorker;
    mapboxgl.accessToken = KEY;

    if (!mapboxgl.supported()) {
        return (
            <div>
                
                {alert('Your browser does not support Mapbox GL')};
                
            </div>
        );
    }

    return (
        <React.Fragment>
            <Map {...mapboxgl}/>
        </React.Fragment>
    )
}

export default App
