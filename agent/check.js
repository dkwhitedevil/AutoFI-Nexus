import 'dotenv/config';

console.log('PRIVATE_KEY raw:', process.env.PRIVATE_KEY);
console.log('PRIVATE_KEY valid hex?', process.env.PRIVATE_KEY?.startsWith('0x'));
console.log('PRIVATE_KEY length:', process.env.PRIVATE_KEY?.length);
