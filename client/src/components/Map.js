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
    const { workerClass, accessToken } = props;
    const mapContainer = useRef();
    const [lng, setLng] = useState(-71.0589);
    const [lat, setLat] = useState(42.3601);
    const [zoom, setZoom] = useState(15);


    //need to do this in async way for blocking
    const getLeafFromCluster = (meterFeaturesInput, clusterSourceInput) => {
        console.log('getLeafFromCluster')
        let clusterMeterFeatures = [];
        try {
            for (let feature of meterFeaturesInput) {
                if (!feature.id) {
                    // console.count('meter')
                    clusterMeterFeatures.push(feature)
                } else {
                    console.count('meter cluster')
                    console.log(feature.id)
                    console.log(feature.properties.point_count)
                    clusterSourceInput.getClusterLeaves(
                        feature.id,
                        feature.properties.point_count,
                        0,
                        (err, aFeatures) => {
                            if (!aFeatures || err) {
                                console.error(err)
                                
                            } else {
                                // console.log('aFeatures type', typeof aFeatures )
                                // console.log('aFeatures', aFeatures)
                                // console.count('aFeatures')
                                clusterMeterFeatures.push( ...aFeatures );
                                // let leaf;
                                // for (leaf of aFeatures) {
                                //     // console.count('leaf')
                                //     clusterMeterFeatures.push(leaf)
                                // }
                            }
                    });
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            console.log('clusterMeterFeatures', clusterMeterFeatures)
            return clusterMeterFeatures;
        }
    }

    // const asyncFeaturesReturn = async (clusterSourceInput) => {
    //     console.log('asyncFeaturesReturn')
    //     return await getLeafFromCluster(clusterSourceInput);
    // }

    const getGeojsonData = (map, clusterMeterFeaturesAsync) => {
        //add leafs in range to geojson object
        console.log('clusterMeterFeaturesAsync', clusterMeterFeaturesAsync)
        map.getSource('nearest-meter').setData({
            type: 'FeatureCollection',
            features: clusterMeterFeaturesAsync
        });
        let geojsonReturn = map.getSource('nearest-meter')._data;
        console.log('geojson features', geojsonReturn?.features)
        console.log('geojson?', geojsonReturn)
        return geojsonReturn;
    }

    const findNearest = (meterCollection, lngLat) => {
        console.log('getMeterCollection', meterCollection)
        let result;
        if (meterCollection?.features.length > 0) {
            result = findNearestMeter(lngLat, meterCollection);
            console.log('result', result)
            return result;
        } else {
            console.log('meter collection empty?', meterCollection)
        }             
    }

    const addToMap = (closestMeter, map) => {
        //create marker for closest meter
        const markerMeter = new mapboxgl.Marker({
            color: "#00FF00",
        })

        if (closestMeter) {
            markerMeter.setLngLat([closestMeter.properties.LONGITUDE, closestMeter.properties.LATITUDE])
            markerMeter.addTo(map);
            // mapMarkers.push(markerMeter)
        } else {
            console.log('No result found')
        }
    }
    
    



    const initiateMeterProxSearch = (meterFeaturesMainInput, lngLatInput, mapInput) => {
        //access data source, combine previous two functions
        const clusterSource = mapInput.getSource('meters');
        console.log('clusterSource', clusterSource)
        console.log('meterFeaturesMainInput', meterFeaturesMainInput);
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
            addToMap(result, mapInput);
        }
        
    } 

    

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
            maxBounds: bounds,
            doubleClickZoom: false
        });


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
        })

        const mapMarkers = [];


        const controls = new mapboxgl.NavigationControl()
        map.addControl(controls, 'bottom-right')

        const geocoder = new MapboxGeocoder({
            accessToken: accessToken,
            mapboxgl: mapboxgl,
            zoom: 17
        })

        geocoder.on('result', (e) => {
            const geocodeMeterFeatures = map.queryRenderedFeatures({
                layers: ['meterclusters']
            });
            if (!geocodeMeterFeatures.length) {
                console.log('nothin here');
            }

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
        })

        const scale = new mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: 'imperial'
        });

        map.addControl(scale)


        map.on('dblclick', (e) => {
            //Resets marker list, features-in-range array
            if (mapMarkers.length > 0) {
                mapMarkers.forEach((m) => m.remove())
            }

            //sets new loc, add click marker to map and array
            const lngLat = [e.lngLat.lng, e.lngLat.lat]

            const markerUser = new mapboxgl.Marker({
                color: "#76FF05",
            })
            markerUser.setLngLat([e.lngLat.lng, e.lngLat.lat])
            markerUser.addTo(map);
            mapMarkers.push(markerUser)
        
            //set bounds for query
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

            

            
            

            initiateMeterProxSearch(meterFeatures, lngLat, map);
            

            //needs to be part of async???
            
            



            
         })
       

        map.on('idle', () => {
            const newcenter = map.getCenter();
            const newzoom = map.getZoom()
            console.log(newcenter)
            console.log(newzoom)
            setLat(newcenter.lat)
            setLng(newcenter.lng)
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
