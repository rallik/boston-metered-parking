import { point, featureCollection } from '@turf/helpers'
import nearestPoint from '@turf/nearest-point';

const findNearestPoint = (userloc, meterfeatureset) => {
    // console.log(meterfeatureset)
    const targetpoint = point(userloc)

    console.log('memeterfeatureset', meterfeatureset.features);
    for (let meter of meterfeatureset.features) {
        console.log(meter)
    };

    let nearest;
    try {
        nearest = nearestPoint(targetpoint, meterfeatureset);
    } catch (error) {
        console.error(error)
    }
    return nearest;
}

export default findNearestPoint
