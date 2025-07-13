#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Expo OSM SDK
 * Orchestrates all testing phases for accuracy and compatibility validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  phases: {
    unit: {
      name: 'Unit Tests',
      command: 'npm test -- --testMatch="**/__tests__/**/*.test.(ts|tsx)"',
      timeout: 120000,
      required: true,
    },
    integration: {
      name: 'Integration Tests',
      command: 'npm test -- --testMatch="**/__tests__/integration/**/*.test.(ts|tsx)"',
      timeout: 180000,
      required: true,
    },
    performance: {
      name: 'Performance Tests',
      command: 'npm test -- --testMatch="**/__tests__/performance/**/*.test.(ts|tsx)"',
      timeout: 300000,
      required: true,
    },
    compatibility: {
      name: 'Compatibility Tests',
      command: 'npm test -- --testMatch="**/__tests__/integration/compatibility.test.(ts|tsx)"',
      timeout: 240000,
      required: true,
    },
    accuracy: {
      name: 'Accuracy Tests',
      command: 'npm test -- --testMatch="**/__tests__/utils/coordinate.test.(ts|tsx)"',
      timeout: 120000,
      required: true,
    },
  },
  coverage: {
    enabled: true,
    threshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  reporting: {
    formats: ['text', 'html', 'json'],
    outputDir: 'test-reports',
  },
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    performance: '⚡',
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runCommand(command, options = {}) {
  const { timeout = 60000, silent = false } = options;
  
  try {
    const output = execSync(command, {
      timeout,
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, code: error.status };
  }
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      skipped: results.filter(r => r.skipped).length,
    },
    phases: results,
    recommendations: [],
  };

  // Add recommendations based on results
  if (report.summary.failed > 0) {
    report.recommendations.push('Address failing tests before publishing');
  }

  const performanceResult = results.find(r => r.phase === 'performance');
  if (performanceResult && performanceResult.duration > 300000) {
    report.recommendations.push('Performance tests are taking too long - investigate optimization opportunities');
  }

  return report;
}

function saveReport(report, format) {
  const outputDir = TEST_CONFIG.reporting.outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `test-report-${new Date().toISOString().split('T')[0]}.${format}`;
  const filepath = path.join(outputDir, filename);

  switch (format) {
    case 'json':
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      break;
    case 'html':
      const htmlContent = generateHTMLReport(report);
      fs.writeFileSync(filepath, htmlContent);
      break;
    case 'text':
      const textContent = generateTextReport(report);
      fs.writeFileSync(filepath, textContent);
      break;
  }

  log(`Report saved: ${filepath}`, 'success');
}

function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Expo OSM SDK Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f5e8; padding: 15px; border-radius: 5px; text-align: center; }
        .phase { margin: 10px 0; padding: 15px; border-left: 4px solid #007acc; }
        .success { border-left-color: #28a745; }
        .failure { border-left-color: #dc3545; }
        .skipped { border-left-color: #ffc107; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Expo OSM SDK Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>${report.summary.total}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric">
            <h3>${report.summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric">
            <h3>${report.summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${report.summary.skipped}</h3>
            <p>Skipped</p>
        </div>
    </div>
    
    <h2>Test Phases</h2>
    ${report.phases.map(phase => `
        <div class="phase ${phase.success ? 'success' : 'failure'}">
            <h3>${phase.name}</h3>
            <p><strong>Status:</strong> ${phase.success ? '✅ Passed' : '❌ Failed'}</p>
            <p><strong>Duration:</strong> ${phase.duration}ms</p>
            ${phase.error ? `<p><strong>Error:</strong> ${phase.error}</p>` : ''}
        </div>
    `).join('')}
    
    ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>🎯 Recommendations</h2>
            <ul>
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    ` : ''}
</body>
</html>
  `;
}

function generateTextReport(report) {
  return `
# Expo OSM SDK Test Report

Generated: ${report.timestamp}

## Summary
- Total Tests: ${report.summary.total}
- Passed: ${report.summary.passed}
- Failed: ${report.summary.failed}
- Skipped: ${report.summary.skipped}

## Test Phases

${report.phases.map(phase => `
### ${phase.name}
- Status: ${phase.success ? '✅ Passed' : '❌ Failed'}
- Duration: ${phase.duration}ms
${phase.error ? `- Error: ${phase.error}` : ''}
`).join('')}

${report.recommendations.length > 0 ? `
## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}
  `;
}

// Main test runner
async function runTests() {
  log('🚀 Starting Expo OSM SDK Test Suite', 'info');
  log('Testing for accuracy, compatibility, and performance', 'info');
  
  const results = [];
  const startTime = Date.now();

  // Run each test phase
  for (const [phaseKey, phaseConfig] of Object.entries(TEST_CONFIG.phases)) {
    log(`\n🔄 Running ${phaseConfig.name}...`, 'info');
    const phaseStartTime = Date.now();
    
    const result = runCommand(phaseConfig.command, {
      timeout: phaseConfig.timeout,
      silent: false,
    });

    const phaseDuration = Date.now() - phaseStartTime;
    
    const phaseResult = {
      phase: phaseKey,
      name: phaseConfig.name,
      success: result.success,
      duration: phaseDuration,
      required: phaseConfig.required,
      error: result.error,
      skipped: false,
    };

    if (result.success) {
      log(`✅ ${phaseConfig.name} completed successfully (${phaseDuration}ms)`, 'success');
    } else {
      log(`❌ ${phaseConfig.name} failed: ${result.error}`, 'error');
      
      if (phaseConfig.required) {
        log('⚠️  This is a required test phase. Consider addressing failures before publishing.', 'warning');
      }
    }

    results.push(phaseResult);
  }

  // Generate coverage report if enabled
  if (TEST_CONFIG.coverage.enabled) {
    log('\n📊 Generating coverage report...', 'info');
    const coverageResult = runCommand('npm run test:coverage', { timeout: 120000 });
    
    if (coverageResult.success) {
      log('✅ Coverage report generated', 'success');
    } else {
      log('⚠️  Coverage report generation failed', 'warning');
    }
  }

  // Generate test reports
  const totalDuration = Date.now() - startTime;
  const report = generateReport(results);
  
  log(`\n📋 Test suite completed in ${totalDuration}ms`, 'info');
  log(`📊 Results: ${report.summary.passed} passed, ${report.summary.failed} failed`, 'info');

  // Save reports in different formats
  TEST_CONFIG.reporting.formats.forEach(format => {
    saveReport(report, format);
  });

  // Exit with appropriate code
  const hasRequiredFailures = results.some(r => !r.success && r.required);
  if (hasRequiredFailures) {
    log('\n❌ Required tests failed. Address issues before publishing.', 'error');
    process.exit(1);
  } else {
    log('\n🎉 All tests completed successfully! SDK is ready for publishing.', 'success');
    process.exit(0);
  }
}

// CLI argument parsing
const args = process.argv.slice(2);
const options = {
  phase: args.find(arg => arg.startsWith('--phase='))?.split('=')[1],
  coverage: args.includes('--coverage'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help'),
};

if (options.help) {
  console.log(`
🧪 Expo OSM SDK Test Runner

Usage: node scripts/test-runner.js [options]

Options:
  --phase=<phase>    Run specific test phase (unit, integration, performance, compatibility, accuracy)
  --coverage         Generate coverage report
  --verbose          Enable verbose output
  --help             Show this help message

Examples:
  node scripts/test-runner.js                    # Run all tests
  node scripts/test-runner.js --phase=unit       # Run only unit tests
  node scripts/test-runner.js --coverage         # Run all tests with coverage
  `);
  process.exit(0);
}

// Run specific phase or all tests
if (options.phase) {
  const phaseConfig = TEST_CONFIG.phases[options.phase];
  if (!phaseConfig) {
    log(`❌ Unknown test phase: ${options.phase}`, 'error');
    process.exit(1);
  }
  
  log(`🎯 Running specific phase: ${phaseConfig.name}`, 'info');
  const result = runCommand(phaseConfig.command, { timeout: phaseConfig.timeout });
  
  if (result.success) {
    log(`✅ ${phaseConfig.name} completed successfully`, 'success');
    process.exit(0);
  } else {
    log(`❌ ${phaseConfig.name} failed: ${result.error}`, 'error');
    process.exit(1);
  }
} else {
  // Run all tests
  runTests().catch(error => {
    log(`❌ Test runner failed: ${error.message}`, 'error');
    process.exit(1);
  });
} 