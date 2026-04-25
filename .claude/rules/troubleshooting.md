# Troubleshooting

## Prisma Issues

- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` for quick prototyping (no migration)
- Check `DATABASE_URL` format for PostgreSQL

## Auth.js Issues

- Ensure `NEXTAUTH_SECRET` is set (32+ chars)
- Ensure `PUBLIC_JWT_SECRET` is set for public auth
- Check `NEXTAUTH_URL` matches your dev URL
- Clear cookies if session issues persist

## MUI SSR Issues

- Wrap app with `AppRouterCacheProvider` from `@mui/material-nextjs/v15-appRouter`
- Use `"use client"` for interactive MUI components
