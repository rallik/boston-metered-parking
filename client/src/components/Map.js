import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import meterdata from '../data/Parking_Meters.geojson';
import neighborhooddata from '../data/Boston_Neighborhoods.geojson';
import findNearestMeter from '../utils/findNearestPoint'
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import '../site.scss';



const Map = (props) => {

    //Initialize state vars
    console.log('props', props)
    const { workerClass, accessToken } = props;
    const mapContainer = useRef();
    const [lngLat, setLngLat] = useState([-71.0589, 42.3601]);
    const [zoom, setZoom] = useState(15);
    let markers = [];


    const createMap = () => {
        const bounds = [
            [-71.27, 42.2258],
            [-70.8703, 42.4348]
        ]

        return new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: lngLat,
            zoom: zoom,
            maxBounds: bounds,
            doubleClickZoom: false
        });
    };


    const newMarker = (markerType) => {
        switch (markerType) {
            case 'user':
                return new mapboxgl.Marker({
                    color: "#00d9ff",
                    anchor: "center",
                    offset: 0
                });
            case 'result':
                return new mapboxgl.Marker({
                    color: "#00FF00",
                    anchor: "center",
                    offset: 0
                });
            default:
                break;
        }
    };

   

    const clearMarkers = () => {
        let current_markers = markers;
        if (current_markers.length > 0) {
            console.table('clearmarker markers state', current_markers)

            current_markers.forEach((m) => {
                console.log(m)
                m.remove()
            })
            markers = [];
        console.table('clearmarker markers state - CLEARED?', current_markers);
        }
        
    };




    //need to do this in async way for blocking
    const getLeafFromCluster = (meterFeaturesInput, clusterSourceInput) => {
        console.log('getLeafFromCluster')
        let notClusters = [];
        let areClusters = [];
        let metersFromClusters = [];
        let meterFeaturesReturn;
        try {
            for (let feature of meterFeaturesInput) {
                if (!feature.id) {
                    notClusters.push(feature)
                } else {
                    areClusters.push(feature)
                }
            }

            // console.log('notClusters', notClusters)
            // console.log('areClusters', areClusters)



            for (let clusters of areClusters) {
                clusterSourceInput.getClusterLeaves(
                    clusters.id,
                    clusters.properties.point_count,
                    0,
                    (err, aFeatures) => {
                        for (let leaf of aFeatures) {
                            metersFromClusters.push(leaf);
                        }
                });
            }

            // console.log('metersFromClusters', metersFromClusters)
        } catch (err) {
            console.error(err)
        } finally {
            // console.log('notClusters 2', notClusters)
            // console.log('metersFromClusters 2', metersFromClusters)
            meterFeaturesReturn = [...notClusters, ...metersFromClusters];
            // console.log('meterFeaturesReturn', meterFeaturesReturn)
        }
        return meterFeaturesReturn;
    }

    // const asyncFeaturesReturn = async (clusterSourceInput) => {
    //     console.log('asyncFeaturesReturn')
    //     return await getLeafFromCluster(clusterSourceInput);
    // }

    const getGeojsonData = (map, clusterMeterFeaturesAsync) => {
        //add leafs in range to geojson object
        // console.log('clusterMeterFeaturesAsync', clusterMeterFeaturesAsync)
        map.getSource('nearest-meter').setData({
            type: 'FeatureCollection',
            features: clusterMeterFeaturesAsync
        });

        //TODO Check here for delay on data access
        let geojsonReturn = map.getSource('nearest-meter')._data;
        // console.log('geojson features', geojsonReturn?.features)
        // console.log('geojson?', geojsonReturn)
        return geojsonReturn;
    }

    const findNearest = (meterCollection, userInputLngLat) => {
        console.log('getMeterCollection', meterCollection)
        let result;
        // if (meterCollection?.features?.length > 0) {
            result = findNearestMeter(userInputLngLat, meterCollection);
            console.log('result', result)
            return result;
        // } else {
            // console.log('meter collection empty?', meterCollection)
        // }             
    }

    
    
    



    const initiateMeterProxSearch = (meterFeaturesMainInput, lngLatInput, mapInput) => {
        //access data source, combine previous two functions
        const clusterSource = mapInput.getSource('meters');
        // console.log('clusterSource', clusterSource)
        // console.log('meterFeaturesMainInput', meterFeaturesMainInput);
        let leafs;
        try {
            leafs = getLeafFromCluster(meterFeaturesMainInput, clusterSource);
            console.log('leafs', leafs)
        } catch (err) {
            console.error(err)
        } finally {
            const geojson = getGeojsonData(mapInput, leafs)
            console.log('finally geojson', geojson)
            console.table('finally geojson table', geojson.features)
            console.log('finally geojson type', typeof geojson)
            const result = findNearest(geojson, lngLatInput);
            if (result) {
                let result_marker = newMarker('result');
                let result_coords = result.geometry.coordinates;
                // addMarkerToMap(result_marker, result_coords, mapInput);
                result_marker.setLngLat(result_coords);
                result_marker.addTo(mapInput);
                // setMarkers(markers => [...markers, result_marker]);
                markers = [...markers, result_marker]
            } else {
    
                // let tryagain = new mapboxgl.Popup()
                // .setLngLat(lngLatInput)
                // .setHTML('<h1>No meters Found, try again!</h1>')
                // tryagain.addTo(mapInput);

                mapInput.flyTo({
                    center: lngLatInput,
                    zoom: zoom + 4
                });

                let rerendered_features = mapInput.queryRenderedFeatures({
                    layers: ['meterclusters']
                });
                if (!rerendered_features.length) {
                    console.log('nothin here');
                } else {
                    initiateMeterProxSearch(rerendered_features, lngLatInput, mapInput)
                }
                

            }
        }
        
    } 

    

    useEffect(() => {
        const map = createMap();


        map.on('load', () => {
            map.addSource('meters', {
                type: 'geojson',
                data: meterdata,
                cluster: true,
                clusterMaxZoom: 17,
                clusterRadius: 50
            })
            
            map.addLayer({
                id: 'meterclusters',
                type: 'circle',
                source: 'meters',
                clusterMinPoints: 6,
                clusterMaxZoom: 16,
                clusterRadius: 200,
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
            
            map.addSource('nearest-meter', {
                type: 'geojson',
                data: {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });
        });

        //*************************** TODO need to move this ***************************
        const controls = new mapboxgl.NavigationControl()
        map.addControl(controls, 'bottom-right')

        const geocoder = new MapboxGeocoder({
            accessToken: accessToken,
            mapboxgl: mapboxgl,
            zoom: 17
        })

        geocoder.on('result', (e) => {
            clearMarkers();
            const geocodeMeterFeatures = map.queryRenderedFeatures({
                layers: ['meterclusters']
            });
            if (!geocodeMeterFeatures.length) {
                console.log('nothin here');
            }

            let geocoder_marker = newMarker('user');
            let geocoder_coords = e.result.center;

            // addMarkerToMap(geocoder_marker, geocoder_coords, map);

            geocoder_marker.setLngLat(geocoder_coords);
            geocoder_marker.addTo(map);
            // setMarkers([geocoder_marker]);
            markers = [geocoder_marker];
            


            initiateMeterProxSearch(geocodeMeterFeatures, e.result.center, map);
        })
        
        map.addControl(geocoder, 'bottom-left')

        const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
                trackUserLocation: true
            });
        
        map.addControl(geolocate, 'bottom-right');

        // geolocate.on('trackuserlocationstart', () => {
        //     console.log('tracked')
        // })
        geolocate.on('error', () => console.log('An error event has occurred.'));
        geolocate.on('outofmaxbounds', () => {
            alert('This app is limited to the city of Boston.')
            map.removeControl(geolocate)
            map.addControl(geolocate, 'bottom-right')
        });

        //Send this result to nearest meter function
        geolocate.on('geolocate', (e) => {
            clearMarkers();

            const geolocateMeterFeatures = map.queryRenderedFeatures({
                layers: ['meterclusters']
            });
            if (!geolocateMeterFeatures.length) {
                console.log('nothin here');
            }
            // console.log([e.coords.longitude, e.coords.latitude]);

            let geolocate_marker = newMarker('user');
            let geolocate_coords = [e.coords.longitude, e.coords.latitude];

            geolocate_marker.setLngLat(geolocate_coords);
            geolocate_marker.addTo(map);
            markers = [geolocate_coords];


            initiateMeterProxSearch(geolocateMeterFeatures, e.result.center, map);

        });

        //Add scale to bottom left
        const scale = new mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: 'imperial'
        });

        map.addControl(scale)


        map.on('dblclick', (e) => {
            console.log('dbclick',e)
            //Resets marker list, features-in-range array
            clearMarkers();
            // setMarkers([]);

            //sets new loc, add click marker to map and array
            let double_click_marker = newMarker('user');
            let double_click_coords = [e.lngLat.lng, e.lngLat.lat];

            // addMarkerToMap(double_click_marker, double_click_coords, map);
            double_click_marker.setLngLat(double_click_coords);
            double_click_marker.addTo(map);
            // setMarkers([double_click_marker]);
            markers = [double_click_marker];

            // const markerUser = new mapboxgl.Marker({
            //     color: "#76FF05",
            // })
            // markerUser.setLngLat([e.lngLat.lng, e.lngLat.lat])
            // markerUser.addTo(map);
            // mapMarkers.push(markerUser)

            
        
            // set bounds for query
            const wh = 300;
            console.log(e.point)
            console.log(e.point.x - wh, e.point.y - wh)
            console.log(e.point.x + wh, e.point.y + wh)
            const querybounds = [[e.point.x - wh / 2, e.point.y - wh / 2], [e.point.x + wh / 2, e.point.y + wh / 2]]
            
            //query features in range
            const meterFeatures = map.queryRenderedFeatures(
                querybounds,
                { layers: ['meterclusters'] })
            if (!meterFeatures.length) {
                console.log('nothin here');
            }
            console.log('mf : ',meterFeatures)
            console.log('mfl : ',meterFeatures.length)
            console.log('mfeq : ',meterFeatures[0] == meterFeatures[1])
            console.log(e)
            console.log(e.point)

            

            
            

            initiateMeterProxSearch(meterFeatures, double_click_coords, map);
            

            //needs to be part of async???
            
            



            
         })
       

        map.on('idle', () => {
            const newcenter = map.getCenter();
            const newzoom = map.getZoom()
            console.log(newcenter)
            console.log(newzoom)
            setLngLat([newcenter.lng, newcenter.lat])
            setZoom(newzoom)
        })


        return () => map.remove();
        }, []);
        
    return (
        <React.Fragment>
            <div style={{zIndex: '0'}} className="map-container" ref={mapContainer}></div>
        </React.Fragment>
    );

}

export default Map
