// Debug script specifically for Nigeria location detection
import geoip from 'geoip-lite';

// Test with known Nigerian IP addresses
const nigerianIPs = [
  '197.210.70.1',    // MTN Nigeria
  '197.149.90.1',    // Airtel Nigeria  
  '105.112.0.1',     // Globacom Nigeria
  '41.203.64.1',     // MainOne Nigeria
  '197.255.125.1'    // NITEL Nigeria
];

console.log('🇳🇬 Testing Nigeria Location Detection...\n');

// Test geoip-lite with Nigerian IPs
console.log('📍 Testing geoip-lite database:');
nigerianIPs.forEach((ip, index) => {
  console.log(`\n${index + 1}. Testing IP: ${ip}`);
  const result = geoip.lookup(ip);
  
  if (result) {
    console.log(`   ✅ Country: ${result.country}`);
    console.log(`   📍 City: ${result.city || 'Unknown'}`);
    console.log(`   🌍 Region: ${result.region || 'Unknown'}`);
    console.log(`   🕐 Timezone: ${result.timezone || 'Unknown'}`);
    console.log(`   📍 Coordinates: [${result.ll?.[0]}, ${result.ll?.[1]}]`);
  } else {
    console.log(`   ❌ No data found for ${ip}`);
  }
});

// Test ip2geo 
console.log('\n\n🌐 Testing ip2geo service:');

// Import ip2geo correctly for CommonJS
import ip2geoPackage from 'ip2geo';
const { ip2geo } = ip2geoPackage;

const testIp2Geo = async () => {
  for (let i = 0; i < nigerianIPs.length; i++) {
    const ip = nigerianIPs[i];
    console.log(`\n${i + 1}. Testing IP: ${ip} with ip2geo`);
    
    try {
      const result = await ip2geo(ip);
      if (result) {
        console.log(`   ✅ Country: ${result.country}`);
        console.log(`   🏙️ City: ${result.city || 'Unknown'}`);
        console.log(`   📍 Country Code: ${result.country_code}`);
        console.log(`   🌍 Region: ${result.region || 'Unknown'}`);
        console.log(`   📍 Coordinates: [${result.latitude}, ${result.longitude}]`);
      } else {
        console.log(`   ❌ No data found for ${ip}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Test your current IP detection
console.log('\n\n🔍 Testing current IP detection method:');

// Simulate getting user's actual IP (you can replace this with your actual IP)
const getUserIP = () => {
  // This would normally come from the request in the backend
  // For testing, we'll use a known Nigerian IP
  return '197.210.70.1'; // MTN Nigeria IP for testing
};

const testCurrentIP = getUserIP();
console.log(`\n🎯 Testing current IP: ${testCurrentIP}`);

const geoipResult = geoip.lookup(testCurrentIP);
console.log('geoip-lite result:', geoipResult);

testIp2Geo().then(() => {
  console.log('\n🏁 Nigeria location testing completed!');
  console.log('\n💡 Recommendations:');
  console.log('1. If geoip-lite shows correct Nigerian data, the issue might be with IP detection');
  console.log('2. If both services fail, check your actual IP address');
  console.log('3. Consider updating geoip-lite database: npm run updatedb in node_modules/geoip-lite');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error during testing:', error);
  process.exit(1);
}); 