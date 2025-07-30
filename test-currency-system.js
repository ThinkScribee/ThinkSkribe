// Test Currency System
const API_BASE_URL = 'http://localhost:5000';

async function testCurrencySystem() {
  console.log('🔍 Testing Currency System...\n');
  
  // Test 1: Location Detection
  console.log('📍 Testing Location Detection...');
  try {
    const locationResponse = await fetch(`${API_BASE_URL}/api/location/detect`);
    const locationData = await locationResponse.json();
    console.log('✅ Location Response:', JSON.stringify(locationData, null, 2));
    
    if (locationData.success && locationData.data) {
      console.log('✅ Location detected successfully');
      console.log(`   Country: ${locationData.data.country}`);
      console.log(`   City: ${locationData.data.city}`);
      console.log(`   Currency: ${locationData.data.currency}`);
      console.log(`   Symbol: ${locationData.data.currencySymbol}`);
    }
  } catch (error) {
    console.error('❌ Location Detection Error:', error);
  }
  
  // Test 2: Currency Detection
  console.log('\n💰 Testing Currency Detection...');
  try {
    const currencyResponse = await fetch(`${API_BASE_URL}/api/location/currency`);
    const currencyData = await currencyResponse.json();
    console.log('✅ Currency Response:', JSON.stringify(currencyData, null, 2));
    
    if (currencyData.success && currencyData.currency) {
      console.log('✅ Currency detected successfully');
      console.log(`   Currency Code: ${currencyData.currency.code}`);
      console.log(`   Currency Symbol: ${currencyData.currency.symbol}`);
      console.log(`   Exchange Rate: ${currencyData.currency.exchangeRate}`);
      console.log(`   Location: ${currencyData.location.city}, ${currencyData.location.country}`);
    }
  } catch (error) {
    console.error('❌ Currency Detection Error:', error);
  }
  
  console.log('\n✅ Test Complete!');
}

testCurrencySystem(); 