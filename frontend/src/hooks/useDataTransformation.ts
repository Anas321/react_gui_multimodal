import { useState } from 'react';


export default function useDataTransformation() {

      const [isLogScale, setIsLogScale] = useState(false);
      const [lowerPercentile, setLowerPercentile] = useState(1);
      const [upperPercentile, setUpperPercentile] = useState(99);
      const [normalization, setNormalization] = useState<string>('none');
      const [imageColormap, setImageColormap] = useState('Viridis');
      const [differenceColormap, setDifferenceColormap] = useState('RdBu');
      const [normalizationMode, setNormalizationMode] = useState('together');

    return {
        isLogScale,
        setIsLogScale,
        lowerPercentile,
        setLowerPercentile,
        upperPercentile,
        setUpperPercentile,
        normalization,
        setNormalization,
        imageColormap,
        setImageColormap,
        differenceColormap,
        setDifferenceColormap,
        normalizationMode,
        setNormalizationMode,
    }

}
