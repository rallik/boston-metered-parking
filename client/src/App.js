import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker';
import data from './data/Parking_Meters.geojson'
import 'mapbox-gl/dist/mapbox-gl.css';
import './site.scss'

const KEY = process.env.REACT_APP_MB_KEY;

const Map = () => {
    const mapContainer = useRef();
    const [lng, setLng] = useState(-71.0589);
    const [lat, setLat] = useState(42.3601);
    const [zoom, setZoom] = useState(13);

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [lng, lat],
            zoom: zoom
        });

        map.on('load', () => {
            map.addSource('meters', {
                type: 'geojson',
                data: data,
                cluster: true,
                clusterMaxZoom: 17,
                clusterRadius: 50,
            })

            map.addLayer({
                id: 'meterclusters',
                type: 'circle',
                source: 'meters',
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#51bbd6',
                        100,
                        '#f1f075',
                        750,
                        '#f28cb1'
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,
                        100,
                        30,
                        750,
                        40
                    ]
                }
            });

            map.addLayer({
                id: 'meter-count',
                type: 'symbol',
                source: 'meters',
                layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
                }
                });
        })

        

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
