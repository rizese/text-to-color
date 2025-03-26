This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Database Setup

This project uses PostgreSQL with Prisma for data storage.

1. Start the database:

   ```bash
   yarn db:setup
   ```

2. Run database migrations:
   ```bash
   yarn db:migrate
   ```

### Running the Application

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin Dashboard

An admin dashboard is available at [http://localhost:3000/admin](http://localhost:3000/admin) to view all color requests and user sessions.

## Caching System

The application implements a database caching system for text-to-color conversions:

- First-time requests are processed by OpenAI and stored in the database
- Subsequent identical requests (case-insensitive) are served from the database cache
- Conversation-based requests (with history) bypass the cache completely

This reduces API costs and improves response times for common queries.

## Deployment

Deployment to Vercel or other platforms is simplified:

1. The `build` script automatically runs migrations
2. The `postinstall` script generates the Prisma client
3. All you need is to set the following environment variables in your hosting platform:
   - `POSTGRES_URL`: PostgreSQL connection string
   - `DIRECT_URL`: (for Vercel) Direct connection string
   - `OPENAI_API_KEY`: Your OpenAI API key

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
