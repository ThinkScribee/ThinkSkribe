import axios from 'axios';
import chalk from 'chalk';

const API_BASE_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  serverUrl: API_BASE_URL,
  testTimeout: 30000,
  expectedCurrencies: ['usd', 'ngn', 'eur', 'gbp', 'inr'],
  expectedCountries: ['us', 'ng', 'gb', 'in', 'ca']
};

console.log(chalk.blue.bold('🌍 EDU-SAGE Location & Currency System Test'));
console.log(chalk.gray('=' .repeat(60)));

/**
 * Test the location detection endpoint
 */
async function testLocationDetection() {
  console.log(chalk.yellow('\n📍 Testing Location Detection...'));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/location/detect`, {
      timeout: TEST_CONFIG.testTimeout
    });
    
    if (response.data.success) {
      const { data } = response.data;
      console.log(chalk.green('✅ Location Detection Success'));
      console.log(`   Country: ${data.flag} ${data.country} (${data.countryCode})`);
      console.log(`   City: ${data.city}`);
      console.log(`   Currency: ${data.currencySymbol} ${data.currency.toUpperCase()}`);
      console.log(`   Exchange Rate: 1 USD = ${data.exchangeRate} ${data.currency.toUpperCase()}`);
      console.log(`   Payment Gateway: ${data.isAfrican ? 'Paystack' : 'Stripe'}`);
      
      return data;
    } else {
      throw new Error('Location detection returned unsuccessful response');
    }
  } catch (error) {
    console.log(chalk.red('❌ Location Detection Failed'));
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Test the currency conversion endpoint
 */
async function testCurrencyConversion() {
  console.log(chalk.yellow('\n💱 Testing Currency Conversion...'));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/location/currency`, {
      timeout: TEST_CONFIG.testTimeout
    });
    
    if (response.data.success) {
      const { location, currency } = response.data;
      console.log(chalk.green('✅ Currency Conversion Success'));
      console.log(`   Detected Location: ${location.flag} ${location.displayName}`);
      console.log(`   Currency: ${currency.symbol} ${currency.name} (${currency.code.toUpperCase()})`);
      console.log(`   Exchange Rate: 1 USD = ${currency.exchangeRate} ${currency.code.toUpperCase()}`);
      console.log(`   Last Updated: ${currency.exchangeRateTimestamp}`);
      
      return { location, currency };
    } else {
      throw new Error('Currency conversion returned unsuccessful response');
    }
  } catch (error) {
    console.log(chalk.red('❌ Currency Conversion Failed'));
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

/**
 * Test currency conversion rates
 */
async function testCurrencyRates() {
  console.log(chalk.yellow('\n💰 Testing Currency Rate Conversions...'));
  
  const testCases = [
    { from: 'usd', to: 'ngn', amount: 100 },
    { from: 'usd', to: 'eur', amount: 100 },
    { from: 'usd', to: 'gbp', amount: 100 },
    { from: 'usd', to: 'inr', amount: 100 }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment/currency-rate`, {
        params: testCase,
        timeout: TEST_CONFIG.testTimeout
      });
      
      console.log(chalk.green(`✅ ${testCase.from.toUpperCase()} → ${testCase.to.toUpperCase()}`));
      console.log(`   ${testCase.amount} ${testCase.from.toUpperCase()} = ${response.data.formattedConverted}`);
      console.log(`   Rate: ${response.data.exchangeRate}`);
    } catch (error) {
      console.log(chalk.red(`❌ ${testCase.from.toUpperCase()} → ${testCase.to.toUpperCase()} Failed`));
      console.log(`   Error: ${error.message}`);
    }
  }
}

/**
 * Test African country detection
 */
async function testAfricanCountryDetection() {
  console.log(chalk.yellow('\n🌍 Testing African Country Detection...'));
  
  const testCountries = ['ng', 'gh', 'ke', 'za', 'us', 'gb', 'ca'];
  
  for (const countryCode of testCountries) {
    try {
      const response = await axios.get(`${API_BASE_URL}/location/is-african/${countryCode}`, {
        timeout: TEST_CONFIG.testTimeout
      });
      
      const { isAfrican, recommendedGateway } = response.data;
      const flag = isAfrican ? '✅ African' : '❌ Non-African';
      const gateway = recommendedGateway === 'paystack' ? '🏦 Paystack' : '💳 Stripe';
      
      console.log(`   ${countryCode.toUpperCase()}: ${flag} → ${gateway}`);
    } catch (error) {
      console.log(chalk.red(`   ${countryCode.toUpperCase()}: Error - ${error.message}`));
    }
  }
}

/**
 * Test server health
 */
async function testServerHealth() {
  console.log(chalk.yellow('\n🏥 Testing Server Health...'));
  
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      timeout: 5000
    });
    
    if (response.data.status === 'healthy') {
      console.log(chalk.green('✅ Server Health Check Passed'));
    } else {
      console.log(chalk.yellow('⚠️ Server Health Check Returned:', response.data.status));
    }
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ Server Health Check Failed'));
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Run comprehensive location system test
 */
async function runLocationSystemTest() {
  console.log(chalk.cyan('\n🧪 Starting Comprehensive Location System Test...\n'));
  
  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Server Health
  totalTests++;
  const serverHealthy = await testServerHealth();
  if (serverHealthy) passedTests++;
  
  if (!serverHealthy) {
    console.log(chalk.red('\n❌ Server is not healthy. Stopping tests.'));
    return;
  }
  
  // Test 2: Location Detection
  totalTests++;
  const locationData = await testLocationDetection();
  if (locationData) passedTests++;
  
  // Test 3: Currency Conversion
  totalTests++;
  const currencyData = await testCurrencyConversion();
  if (currencyData) passedTests++;
  
  // Test 4: Currency Rates
  totalTests++;
  try {
    await testCurrencyRates();
    passedTests++;
    console.log(chalk.green('✅ Currency Rate Tests Completed'));
  } catch (error) {
    console.log(chalk.red('❌ Currency Rate Tests Failed'));
  }
  
  // Test 5: African Country Detection
  totalTests++;
  try {
    await testAfricanCountryDetection();
    passedTests++;
    console.log(chalk.green('✅ African Country Detection Tests Completed'));
  } catch (error) {
    console.log(chalk.red('❌ African Country Detection Tests Failed'));
  }
  
  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(chalk.blue.bold('\n📊 Test Results Summary'));
  console.log(chalk.gray('=' .repeat(40)));
  console.log(`Tests Passed: ${chalk.green(passedTests)}/${totalTests}`);
  console.log(`Success Rate: ${chalk.cyan(((passedTests / totalTests) * 100).toFixed(1))}%`);
  console.log(`Duration: ${chalk.magenta(duration)}s`);
  
  if (passedTests === totalTests) {
    console.log(chalk.green.bold('\n🎉 All Tests Passed! Location system is working correctly.'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️ Some tests failed. Please check the backend services.'));
  }
  
  // Additional recommendations
  console.log(chalk.blue('\n💡 Recommendations:'));
  console.log('   • Ensure the backend server is running on port 5000');
  console.log('   • Check that all required environment variables are set');
  console.log('   • Verify internet connection for external API calls');
  console.log('   • Test with different IP addresses to verify geolocation');
  
  return { passedTests, totalTests, duration };
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLocationSystemTest().catch(console.error);
}

export { runLocationSystemTest, TEST_CONFIG }; 