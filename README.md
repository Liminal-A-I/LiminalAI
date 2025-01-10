# Liminal AI - The AI platform that turns hand-drawn sketches into production-ready code

LiminalAI is a powerful tool that transforms your sketches and ideas into fully functional user interfaces using AI.

## 🔗 Links

- [App](https://liminalai.app)
- [Liminal AI Gallery](https://liminalai.app/gallery)
- [Pump.fun](https://pump.fun/8fDvZnuDKAuFJbHb7MfUnqLseBuc9B9ahjCQnjyKpump)
- [X](https://x.com/liminalaisol)

## 🚀 Features

- **AI-Powered Design Generation**: Convert sketches to functional UI designs
- **Real-time Preview**: See your designs come to life instantly
- **Export Options**: Export to multiple formats (HTML, React, PNG, SVG)
- **Collaboration Tools**: Work together in real-time
- **Version Control**: Track and manage design iterations
- **Accessibility Focus**: AI-powered accessibility suggestions
- **Cloud Storage**: Secure design storage and sharing

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, TypeScript
- **AI/ML**: Claude 3.5 Sonnet
- **Storage**: Cloudflare R2
- **Database**: PostgreSQL
- **Caching**: Redis
- **Monitoring**: Prometheus, Grafana

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (optional)
- Redis (optional)

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/LiminalAI.git
   cd LiminalAI
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see Environment Configuration section below)

4. Run database migrations (if using PostgreSQL):
   ```bash
   npm run migrate
   # or
   yarn migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🔐 Environment Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and configure the following:

### Required Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID
- `CLOUDFLARE_ACCESS_KEY`: Cloudflare access key
- `CLOUDFLARE_SECRET_KEY`: Cloudflare secret key
- `JWT_SECRET`: Secret key for JWT tokens

### Optional Variables

- `NODE_ENV`: Environment type (development/production/test)
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `ENABLE_METRICS`: Enable/disable metrics collection
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

See `.env.example` for a complete list of available configuration options.

## 🏗️ Project Structure

```
LiminalAI/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── pages/            # Page components
├── lib/                   # Utility functions
├── services/             # External service integrations
├── src/
│   ├── config/           # Configuration
│   ├── core/             # Core business logic
│   └── types/            # TypeScript types
├── public/               # Static assets
└── tests/                # Test files
```

## 🧪 Testing

Run the test suite:
```bash
npm test
# or
yarn test
```

Run tests with coverage:
```bash
npm run test:coverage
# or
yarn test:coverage
```

## 📈 Monitoring

The application includes built-in monitoring:

- **Metrics**: Available at `/metrics` (when enabled)
- **Health Check**: Available at `/api/health`
- **Status**: Available at `/api/status`

## 🔒 Security

- All API endpoints are rate-limited
- JWT-based authentication
- Input validation using Zod
- CORS protection
- Security headers using Helmet
- SQL injection protection
- XSS protection

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Start the production server:
   ```bash
   npm start
   # or
   yarn start
   ```

### Docker Deployment

```bash
docker build -t LiminalAI .
docker run -p 3000:3000 LiminalAI
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- Issues: [GitHub Issues]()

## ✨ Acknowledgments

- TLDraw team for the amazing canvas library
- All our contributors and supporters