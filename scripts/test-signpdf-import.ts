import * as signModule from '@signpdf/signpdf';
import signDefault from '@signpdf/signpdf';

console.log('Module keys:', Object.keys(signModule));
console.log('Default export:', signDefault);
try {
    console.log('Is default a constructor?', new signDefault());
} catch (e) {
    console.log('Default is not a constructor:', e.message);
}
