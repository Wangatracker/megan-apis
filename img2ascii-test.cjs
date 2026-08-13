const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");
const fs = require("fs");

const URL = "https://www.asciiart.eu/image-to-ascii";

// Termux-specific paths
const CHROME_BIN = "/data/data/com.termux/files/usr/bin/chromium-browser";
const CHROMEDRIVER = "/data/data/com.termux/files/usr/bin/chromedriver";

// Try to find Chrome/Chromium
function findChrome() {
  const possiblePaths = [
    CHROME_BIN,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/data/data/com.termux/files/usr/bin/chromium"
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function findChromeDriver() {
  const possiblePaths = [
    CHROMEDRIVER,
    "/usr/bin/chromedriver",
    "/usr/local/bin/chromedriver",
    "/data/data/com.termux/files/usr/bin/chromedriver"
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function getDriver(headless = true) {
  const chromeBin = findChrome();
  const chromeDriver = findChromeDriver();

  if (!chromeBin || !chromeDriver) {
    throw new Error(
      `Chrome/Chromium not found!\n` +
      `Chrome: ${chromeBin || 'NOT FOUND'}\n` +
      `ChromeDriver: ${chromeDriver || 'NOT FOUND'}\n\n` +
      `Install with:\n` +
      `  pkg install chromium\n` +
      `  pkg install chromedriver\n` +
      `Or:\n` +
      `  pkg install tur-repo && pkg install chromium chromedriver`
    );
  }

  console.log(`\x1b[36m[INFO]\x1b[0m Chrome binary: ${chromeBin}`);
  console.log(`\x1b[36m[INFO]\x1b[0m ChromeDriver: ${chromeDriver}`);

  const options = new chrome.Options();
  options.setBinaryPath(chromeBin);
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--disable-gpu");
  options.addArguments("--window-size=1280,1024");
  options.addArguments("--disable-blink-features=AutomationControlled");
  
  if (headless) {
    options.addArguments("--headless=new");
  }

  const service = new chrome.ServiceBuilder(chromeDriver);
  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();
}

// Create a test image if none provided
function createTestImage() {
  const testImagePath = path.join(__dirname, "test-image.png");
  
  // Create a simple PNG using canvas or just use a minimal valid PNG
  // 1x1 pixel PNG (red)
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x8D, 0x2C, 0x36,
    0x41, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(testImagePath, minimalPNG);
  return testImagePath;
}

// Test function
async function testImg2Ascii() {
  console.log('\n\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║         TESTING IMAGE TO ASCII CONVERTER            ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m');

  // Check for required packages
  console.log('\n\x1b[36m[TEST 1]\x1b[0m Checking environment...');
  
  const chromeBin = findChrome();
  const chromeDriver = findChromeDriver();
  const seleniumInstalled = (() => {
    try {
      require.resolve("selenium-webdriver");
      return true;
    } catch {
      return false;
    }
  })();

  console.log(`  Chrome: ${chromeBin ? '\x1b[32m✓ Found\x1b[0m' : '\x1b[31m✗ Not found\x1b[0m'}`);
  console.log(`  ChromeDriver: ${chromeDriver ? '\x1b[32m✓ Found\x1b[0m' : '\x1b[31m✗ Not found\x1b[0m'}`);
  console.log(`  Selenium WebDriver: ${seleniumInstalled ? '\x1b[32m✓ Installed\x1b[0m' : '\x1b[31m✗ Not installed\x1b[0m'}`);

  if (!chromeBin || !chromeDriver || !seleniumInstalled) {
    console.log('\n\x1b[33m[INFO]\x1b[0m Installation required:');
    if (!seleniumInstalled) {
      console.log('  npm install selenium-webdriver');
    }
    if (!chromeBin || !chromeDriver) {
      console.log('  pkg install chromium');
      console.log('  pkg install chromedriver');
      console.log('  (or use tur-repo: pkg install tur-repo && pkg install chromium chromedriver)');
    }
    console.log('\n\x1b[31m[FAIL]\x1b[0m Environment not ready');
    return;
  }

  // Create test image
  console.log('\n\x1b[36m[TEST 2]\x1b[0m Creating test image...');
  const testImage = createTestImage();
  console.log(`\x1b[32m[OK]\x1b[0m Test image created: ${testImage}`);

  // Test WebDriver
  console.log('\n\x1b[36m[TEST 3]\x1b[0m Starting Chrome WebDriver...');
  let driver;
  try {
    driver = getDriver(true);
    console.log(`\x1b[32m[OK]\x1b[0m WebDriver started successfully`);

    // Navigate to website
    console.log('\n\x1b[36m[TEST 4]\x1b[0m Navigating to ASCII art website...');
    await driver.get(URL);
    console.log(`\x1b[32m[OK]\x1b[0m Page loaded: ${URL}`);

    // Check if file input exists
    console.log('\n\x1b[36m[TEST 5]\x1b[0m Checking for file input...');
    try {
      const fileInput = await driver.wait(
        until.elementLocated(By.id("fileElem")), 
        30000
      );
      console.log(`\x1b[32m[OK]\x1b[0m File input found`);

      // Upload test image
      console.log('\n\x1b[36m[TEST 6]\x1b[0m Uploading test image...');
      await fileInput.sendKeys(path.resolve(testImage));
      console.log(`\x1b[32m[OK]\x1b[0m Image uploaded`);

      // Wait for output
      console.log('\n\x1b[36m[TEST 7]\x1b[0m Waiting for ASCII conversion...');
      try {
        const outputElement = await driver.wait(
          until.elementLocated(By.id("output")), 
          30000
        );
        await driver.wait(
          until.elementTextContains(outputElement, " "),
          30000
        );
        const text = await outputElement.getText();
        
        if (text && text.length > 0) {
          console.log(`\x1b[32m[OK]\x1b[0m ASCII conversion successful!`);
          console.log(`\x1b[36m[INFO]\x1b[0m Output length: ${text.length} characters`);
          console.log('\n\x1b[33m[ASCII PREVIEW]\x1b[0m');
          console.log(text.substring(0, 200));
          
          // Save output
          const outputFile = path.join(__dirname, "ascii-output.txt");
          fs.writeFileSync(outputFile, text, "utf-8");
          console.log(`\n\x1b[32m[OK]\x1b[0m Output saved to: ${outputFile}`);
        } else {
          console.log('\x1b[33m[WARN]\x1b[0m No ASCII output generated');
        }
      } catch (e) {
        console.log(`\x1b[33m[WARN]\x1b[0m Output element not found: ${e.message}`);
      }

    } catch (e) {
      console.log(`\x1b[31m[FAIL]\x1b[0m File input not found: ${e.message}`);
    }

    console.log('\n\x1b[35m════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[35m  TEST COMPLETE\x1b[0m');
    console.log('\x1b[35m════════════════════════════════════════════\x1b[0m');

  } catch (e) {
    console.log(`\x1b[31m[FAIL]\x1b[0m WebDriver error: ${e.message}`);
  } finally {
    if (driver) {
      await driver.quit();
      console.log('\n\x1b[36m[INFO]\x1b[0m WebDriver closed');
    }
  }
}

// Run test
testImg2Ascii().catch(console.error);
