import { Card, ColorInput, RangeSlider, Switch } from '@mantine/core';
import { AzimuthalIntegration } from '../types';

interface AzimuthalIntegrationWidgetProps {
  integrations: AzimuthalIntegration[];
  maxQValue: number;  // Add maxQValue prop
  updateAzimuthalQRange: (id: number, range: [number, number]) => void;
  updateAzimuthalRange: (id: number, range: [number, number]) => void;
  updateAzimuthalColor: (id: number, side: 'left' | 'right', color: string) => void;
  deleteAzimuthalIntegration: (id: number) => void;
  toggleAzimuthalVisibility: (id: number) => void;
}

export default function AzimuthalIntegrationWidget({
  integrations,
  maxQValue,  // Receive maxQValue from parent
  updateAzimuthalQRange,
  updateAzimuthalRange,
  updateAzimuthalColor,
  deleteAzimuthalIntegration,
  toggleAzimuthalVisibility
}: AzimuthalIntegrationWidgetProps) {
  // Function to get Q-range values safely
  const getQRangeValues = (integration: AzimuthalIntegration): [number, number] => {
    if (integration.qRange === null) {
      return [0, maxQValue];  // Use maxQValue from backend
    }
    return integration.qRange;
  };

  return (
    <div className="space-y-4 p-4">
      {integrations.map((integration) => {
        const qRangeValues = getQRangeValues(integration);

        return (
          <Card key={integration.id} className="bg-white shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Integration {integration.id}
                </h3>
                <div className="flex space-x-2">
                  <Switch
                    checked={!integration.hidden}
                    onChange={() => toggleAzimuthalVisibility(integration.id)}
                    size="md"
                  />
                  <button
                    onClick={() => deleteAzimuthalIntegration(integration.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Q-Range (Å⁻¹)</label>
                <RangeSlider
                  value={[qRangeValues[0], qRangeValues[1]]}
                  onChange={(value) => updateAzimuthalQRange(integration.id, [value[0], value[1]])}
                  min={0}
                  max={maxQValue}  // Use maxQValue from backend
                  step={maxQValue / 200}  // Adjust step size based on range
                  label={(value) => value.toFixed(2)}
                />

                <label className="text-sm font-medium">Azimuthal Range (degrees)</label>
                <RangeSlider
                  value={[integration.azimuthRange[0], integration.azimuthRange[1]]}
                  onChange={(value) => updateAzimuthalRange(integration.id, [value[0], value[1]])}
                  min={-180}
                  max={180}
                  step={1}
                  label={(value) => `${value}°`}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Left Image Color</label>
                    <ColorInput
                      value={integration.leftColor}
                      onChange={(color) => updateAzimuthalColor(integration.id, 'left', color)}
                      format="hex"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Right Image Color</label>
                    <ColorInput
                      value={integration.rightColor}
                      onChange={(color) => updateAzimuthalColor(integration.id, 'right', color)}
                      format="hex"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
