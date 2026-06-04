const fs = require('fs');
const path = require('path');

// Delete all v1 cached PDFs so they are regenerated fresh with Eduyro branding
const toDelete = [
  '.local-storage/shop-packs/v1/ADDITION.pdf',
  '.local-storage/shop-packs/v1/SUBTRACTION.pdf',
  '.local-storage/shop-packs/v1/MULTIPLICATION.pdf',
  '.local-storage/shop-packs/v1/DIVISION.pdf',
  '.local-storage/shop-samples/v1/ADDITION-sample.pdf',
  '.local-storage/shop-samples/v1/SUBTRACTION-sample.pdf',
  '.local-storage/shop-samples/v1/MULTIPLICATION-sample.pdf',
  '.local-storage/shop-samples/v1/DIVISION-sample.pdf',
];

toDelete.forEach(f => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('✅ Deleted:', f);
  } else {
    console.log('⚠️  Not found:', f);
  }
});

console.log('\nDone — old BrightSteps PDFs removed.');
console.log('New purchases will generate fresh PDFs with Eduyro branding.');
