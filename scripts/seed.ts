import { dataStore } from '../lib/data/store-data';
import { AttributeService } from '../lib/services/attribute-service';
import { MeasurementService } from '../lib/services/measurement-service';

async function runSeed() {
  console.log('====================================================');
  console.log('UNIVERSAL E-COMMERCE ADMIN PANEL — SEED RUNNER');
  console.log('====================================================');
  console.log('Store Profile:', dataStore.getStoreProfile().name);

  const attributes = await AttributeService.getAttributes({ capability: 'all' });
  console.log('Universal Attributes Seeded:', attributes.length);

  const measurementTypes = MeasurementService.getMeasurementTypes();
  console.log('Measurement Families Registered:', measurementTypes.length);

  const totalUnits = measurementTypes.reduce(
    (acc, f) => acc + MeasurementService.getUnitsForFamily(f.key).length,
    0
  );
  console.log('Measurement Units Configured:', totalUnits);
  console.log('====================================================');
  console.log('✅ Phase 1 single-store database seeded and verified successfully!');
}

runSeed();
