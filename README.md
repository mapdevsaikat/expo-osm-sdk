# Expo OSM SDK Project

This repository contains the **Expo OSM SDK** and related demonstration applications.

## 📁 Project Structure

```
SDK/
├── expo-osm-sdk/          # Main SDK package
│   ├── src/               # SDK source code
│   ├── android/           # Android native implementation
│   ├── ios/               # iOS native implementation
│   ├── plugin/            # Expo config plugin
│   ├── example/           # Basic example app
│   ├── __tests__/         # SDK test suites
│   └── package.json       # SDK package configuration
├── expo-demo/             # Advanced demo application
│   ├── src/               # Demo app source code
│   ├── assets/            # Demo app assets
│   └── package.json       # Demo app configuration
└── README.md              # This file
```

## 🚀 Getting Started

### Working with the SDK

```bash
# Navigate to SDK directory
cd expo-osm-sdk

# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Run all tests with coverage
npm run test:all
```

### Working with the Demo App

```bash
# Navigate to demo directory
cd expo-demo

# Install dependencies
npm install

# Start the demo app
npm start
```

## 📦 Publishing

The SDK is published to npm from the `expo-osm-sdk/` directory:

```bash
cd expo-osm-sdk
npm publish
```

## 🔗 Links

- **npm Package**: [expo-osm-sdk](https://www.npmjs.com/package/expo-osm-sdk)
- **GitHub Repository**: [mapdevsaikat/expo-osm-sdk](https://github.com/mapdevsaikat/expo-osm-sdk)
- **Documentation**: See `expo-osm-sdk/README.md` for detailed SDK documentation
- **Demo Setup**: See `expo-demo/README.md` for demo app setup instructions

## 📖 Documentation

- **SDK Documentation**: [`expo-osm-sdk/README.md`](./expo-osm-sdk/README.md)
- **Demo Guide**: [`expo-demo/README.md`](./expo-demo/README.md)
- **Setup Instructions**: [`expo-demo/SETUP_GUIDE.md`](./expo-demo/SETUP_GUIDE.md)

## 🧪 Testing

All tests are located in the SDK directory:

```bash
cd expo-osm-sdk
npm run test:all          # Run all test suites
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:performance  # Performance tests only
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes in the appropriate directory (`expo-osm-sdk/` or `expo-demo/`)
4. Run tests: `cd expo-osm-sdk && npm test`
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [`LICENSE`](./expo-osm-sdk/LICENSE) file for details.

---

Made with ❤️ by [Saikat Maiti](https://github.com/mapdevsaikat) 