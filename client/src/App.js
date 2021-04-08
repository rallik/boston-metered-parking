import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker';
import meterdata from './data/Parking_Meters.geojson';
import neighborhooddata from './data/Boston_Neighborhoods.geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import './site.scss';

const KEY = process.env.REACT_APP_MB_KEY;

const Map = () => {
    const mapContainer = useRef();
    const [lng, setLng] = useState(-71.0589);
    const [lat, setLat] = useState(42.3601);
    const [zoom, setZoom] = useState(13);

    useEffect(() => {
        //[-71.27, 42.2258],
        //[-70.8703, 42.4348]
        const bounds = [
            [-71.27, 42.2258],
            [-70.8703, 42.4348]
        ]

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [lng, lat],
            zoom: zoom,
            maxBounds: bounds
        });

        map.on('load', () => {
            map.addSource('meters', {
                type: 'geojson',
                data: meterdata,
                cluster: true,
                clusterMaxZoom: 17,
                clusterRadius: 50,
            })
            
            map.addSource('neighborhoods', {
                type: 'geojson',
                data: neighborhooddata,
            })

            map.addLayer({
                id: 'neighborhoods',
                type: 'line',
                source: 'neighborhoods',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-width': 1.5
                }
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
