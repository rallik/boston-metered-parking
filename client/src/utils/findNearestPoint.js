import { point, featureCollection } from '@turf/helpers'
import nearestPoint from '@turf/nearest-point';

const findNearestPoint = (userloc, meterfeatureset) => {
    // console.log(meterfeatureset)
    const targetpoint = point(userloc)

    console.log('memeterfeatureset', meterfeatureset.features);
    for (let meter of meterfeatureset.features) {
        console.log(meter)
    };

    const nearest = 11;
    // const nearest = nearestPoint(targetpoint, meterfeatureset)
    return nearest;
}

export default findNearestPoint
