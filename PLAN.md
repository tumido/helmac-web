# Helmac Web - Implementation Plan

> Next.js + TypeScript + MUI + PostgreSQL
> Yearly recurring event website with archive of past editions

---

## Project Overview

**Site type:** Yearly recurring event with archive of past editions
**Language:** Czech (no i18n needed)
**Admin users:** 2-5 (roles: SUPER_ADMIN, ADMIN, EDITOR)
**Emails:** Not required

### Key Features
- Year management (current year + archive)
- Page and content editing
- Gallery/media management
- News/blog
- Admin dashboard with role-based access

---

## 1. Tech Stack

### Core Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",

    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",

    "@prisma/client": "^5.15.0",
    "next-auth": "^5.0.0-beta.19",
    "@auth/prisma-adapter": "^2.4.0",

    "zod": "^3.23.0",
    "argon2": "^0.40.0",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",

    "prisma": "^5.15.0",

    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.3.0",

    "@playwright/test": "^1.45.0"
  }
}
```

### Why These Choices

| Technology | Reason |
|------------|--------|
| Next.js 14 App Router | Modern routing, Server Components, Server Actions |
| MUI 5 | Complete UI library, excellent TypeScript support |
| PostgreSQL | Production-grade DB, JSON support, scalability |
| Prisma | Type-safe ORM, migrations, great developer experience |
| Auth.js v5 | Native App Router support, session management |
| Zod | Runtime validation, Server Actions integration |
| Argon2 | More secure than bcrypt, recommended standard |

---

## 2. Project Structure

```
helmac-web/
├── app/
│   ├── (public)/                    # Public pages
│   │   ├── layout.tsx               # Public layout (Header, Footer)
│   │   ├── page.tsx                 # Home (redirect to current year)
│   │   ├── [year]/                  # Dynamic year routes
│   │   │   ├── page.tsx             # Year homepage
│   │   │   ├── program/page.tsx
│   │   │   ├── registrace/page.tsx
│   │   │   ├── pravidla/page.tsx
│   │   │   ├── galerie/page.tsx
│   │   │   ├── na-pamatku/page.tsx
│   │   │   └── novinky/
│   │   │       ├── page.tsx         # News list
│   │   │       └── [slug]/page.tsx  # News detail
│   │   └── archiv/page.tsx          # Archive of past years
│   │
│   ├── admin/                       # Admin section
│   │   ├── layout.tsx               # Admin layout (Drawer, AppBar)
│   │   ├── page.tsx                 # Dashboard
│   │   ├── login/page.tsx           # Login page
│   │   ├── rocniky/                 # Year management
│   │   │   ├── page.tsx             # Year list
│   │   │   ├── novy/page.tsx        # New year
│   │   │   └── [id]/page.tsx        # Year edit
│   │   ├── stranky/                 # Page management
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── novinky/                 # News management
│   │   │   ├── page.tsx
│   │   │   ├── nova/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── galerie/                 # Media management
│   │   │   ├── page.tsx
│   │   │   └── [albumId]/page.tsx
│   │   └── uzivatele/               # Admin user management
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── upload/route.ts          # Image upload
│   │
│   ├── layout.tsx                   # Root layout
│   ├── not-found.tsx
│   ├── error.tsx
│   └── loading.tsx
│
├── components/
│   ├── ui/                          # General UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   ├── Hero.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ConfirmDialog.tsx
│   ├── admin/                       # Admin components
│   │   ├── AdminLayout.tsx
│   │   ├── AdminDrawer.tsx
│   │   ├── AdminAppBar.tsx
│   │   ├── DataTable.tsx
│   │   ├── RichTextEditor.tsx
│   │   └── ImageUploader.tsx
│   └── forms/                       # Form components
│       ├── PageForm.tsx
│       ├── NewsForm.tsx
│       ├── YearForm.tsx
│       └── UserForm.tsx
│
├── lib/
│   ├── auth.ts                      # Auth.js configuration
│   ├── auth.config.ts               # Auth providers
│   ├── db.ts                        # Prisma client singleton
│   ├── actions/                     # Server Actions
│   │   ├── years.ts
│   │   ├── pages.ts
│   │   ├── news.ts
│   │   ├── media.ts
│   │   └── users.ts
│   ├── validators/                  # Zod schemas
│   │   ├── year.ts
│   │   ├── page.ts
│   │   ├── news.ts
│   │   └── user.ts
│   └── utils/
│       ├── slug.ts
│       └── date.ts
│
├── styles/
│   └── theme.ts                     # MUI theme configuration
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│   └── uploads/                     # Uploaded files (or use external storage)
│
├── middleware.ts                    # Auth middleware
├── next.config.js
├── tsconfig.json
├── .env.local                       # Local env (git ignored)
├── .env.example                     # Env vars template
└── playwright.config.ts
```

---

## 3. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTH - Users and sessions
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String
  role          Role      @default(EDITOR)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  createdNews   News[]    @relation("NewsAuthor")

  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

enum Role {
  SUPER_ADMIN   // Can do everything including user management
  ADMIN         // Can manage content and years
  EDITOR        // Can edit content (not years/users)
}

// ============================================
// YEARS - Main organizational unit
// ============================================

model Year {
  id          String      @id @default(cuid())
  year        Int         @unique          // 2024, 2025, ...
  title       String                        // "Helmac 2024"
  subtitle    String?                       // Optional subtitle
  isActive    Boolean     @default(false)  // Currently active year
  isArchived  Boolean     @default(false)  // Archived year

  startDate   DateTime?                    // Event start date
  endDate     DateTime?                    // Event end date

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  pages       Page[]
  news        News[]
  albums      Album[]

  @@map("years")
}

// ============================================
// PAGES - Individual page content
// ============================================

model Page {
  id          String      @id @default(cuid())
  yearId      String
  year        Year        @relation(fields: [yearId], references: [id], onDelete: Cascade)

  slug        String                        // "program", "pravidla", "registrace"
  title       String                        // "Event Program"

  // Page content as structured JSON
  // Allows flexible sections: hero, text, gallery, cards, etc.
  content     Json        @default("{}")

  // SEO
  seoTitle    String?
  seoDesc     String?

  isPublished Boolean     @default(false)
  sortOrder   Int         @default(0)

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([yearId, slug])
  @@map("pages")
}

// ============================================
// NEWS - Blog/updates
// ============================================

model News {
  id          String      @id @default(cuid())
  yearId      String
  year        Year        @relation(fields: [yearId], references: [id], onDelete: Cascade)

  authorId    String
  author      User        @relation("NewsAuthor", fields: [authorId], references: [id])

  slug        String
  title       String
  excerpt     String?                       // Short description for lists
  content     String      @db.Text          // Full content (Markdown or HTML)
  coverImage  String?                       // Main image URL

  isPublished Boolean     @default(false)
  publishedAt DateTime?

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([yearId, slug])
  @@map("news")
}

// ============================================
// MEDIA - Gallery and images
// ============================================

model Album {
  id          String      @id @default(cuid())
  yearId      String
  year        Year        @relation(fields: [yearId], references: [id], onDelete: Cascade)

  title       String                        // "Event Photos", "Memorial"
  slug        String
  description String?
  coverImage  String?                       // Cover image URL

  sortOrder   Int         @default(0)
  isPublished Boolean     @default(false)

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  images      Image[]

  @@unique([yearId, slug])
  @@map("albums")
}

model Image {
  id          String      @id @default(cuid())
  albumId     String
  album       Album       @relation(fields: [albumId], references: [id], onDelete: Cascade)

  url         String                        // URL or file path
  thumbnailUrl String?                      // Smaller version

  title       String?
  description String?
  altText     String?                       // For accessibility

  width       Int?
  height      Int?
  sizeBytes   Int?
  mimeType    String?

  sortOrder   Int         @default(0)

  createdAt   DateTime    @default(now())

  @@map("images")
}

// ============================================
// AUDIT LOG - Track changes (optional)
// ============================================

model AuditLog {
  id          String      @id @default(cuid())
  userId      String?
  action      String                        // "CREATE", "UPDATE", "DELETE"
  entity      String                        // "Page", "News", "Year"
  entityId    String
  changes     Json?                         // What changed

  createdAt   DateTime    @default(now())

  @@map("audit_logs")
}
```

---

## 4. Authentication (Auth.js v5)

### 4.1 Configuration

```typescript
// lib/auth.config.ts
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import argon2 from "argon2"
import { db } from "./db"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user) return null

        const passwordValid = await argon2.verify(
          user.passwordHash,
          parsed.data.password
        )

        if (!passwordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith("/admin")
      const isOnLogin = nextUrl.pathname === "/admin/login"

      if (isOnAdmin && !isOnLogin) {
        return isLoggedIn
      }

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl))
      }

      return true
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
}
```

```typescript
// lib/auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig,
})

// Helper to get session in Server Components
export async function getSession() {
  return await auth()
}

// Helper to verify admin access
export async function requireAuth(allowedRoles?: string[]) {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Not authenticated")
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error("Insufficient permissions")
  }

  return session
}

// Role-specific checks
export async function requireSuperAdmin() {
  return requireAuth(["SUPER_ADMIN"])
}

export async function requireAdmin() {
  return requireAuth(["SUPER_ADMIN", "ADMIN"])
}

export async function requireEditor() {
  return requireAuth(["SUPER_ADMIN", "ADMIN", "EDITOR"])
}
```

```typescript
// middleware.ts
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/admin/:path*"],
}
```

### 4.2 TypeScript Types

```typescript
// types/next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}
```

---

## 5. Server Actions

### 5.1 Example - Year Management

```typescript
// lib/validators/year.ts
import { z } from "zod"

export const createYearSchema = z.object({
  year: z.number().min(2000).max(2100),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export const updateYearSchema = createYearSchema.partial()

export type CreateYearInput = z.infer<typeof createYearSchema>
export type UpdateYearInput = z.infer<typeof updateYearSchema>
```

```typescript
// lib/actions/years.ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAdmin, requireSuperAdmin } from "@/lib/auth"
import { createYearSchema, updateYearSchema } from "@/lib/validators/year"

export async function createYear(formData: FormData) {
  await requireAdmin()

  const rawData = {
    year: Number(formData.get("year")),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  }

  const validated = createYearSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  try {
    const year = await db.year.create({
      data: validated.data,
    })

    // Create default pages for new year
    await createDefaultPages(year.id)

    revalidatePath("/admin/rocniky")
    return { success: true, data: year }
  } catch (error) {
    return { error: { _form: ["Failed to create year"] } }
  }
}

export async function setActiveYear(yearId: string) {
  await requireAdmin()

  await db.$transaction([
    // Deactivate all years
    db.year.updateMany({
      data: { isActive: false },
    }),
    // Activate selected year
    db.year.update({
      where: { id: yearId },
      data: { isActive: true, isArchived: false },
    }),
  ])

  revalidatePath("/")
  revalidatePath("/admin/rocniky")
  return { success: true }
}

export async function archiveYear(yearId: string) {
  await requireAdmin()

  const year = await db.year.findUnique({ where: { id: yearId } })

  if (year?.isActive) {
    return { error: "Cannot archive active year" }
  }

  await db.year.update({
    where: { id: yearId },
    data: { isArchived: true },
  })

  revalidatePath("/admin/rocniky")
  revalidatePath("/archiv")
  return { success: true }
}

async function createDefaultPages(yearId: string) {
  const defaultPages = [
    { slug: "uvod", title: "Uvod", sortOrder: 0 },
    { slug: "program", title: "Program", sortOrder: 1 },
    { slug: "registrace", title: "Registrace", sortOrder: 2 },
    { slug: "pravidla", title: "Pravidla", sortOrder: 3 },
    { slug: "galerie", title: "Galerie", sortOrder: 4 },
    { slug: "na-pamatku", title: "Na pamatku", sortOrder: 5 },
  ]

  await db.page.createMany({
    data: defaultPages.map((page) => ({
      ...page,
      yearId,
      content: {},
      isPublished: false,
    })),
  })
}
```

### 5.2 Example - Page Management

```typescript
// lib/validators/page.ts
import { z } from "zod"

// Schema for page sections
const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    title: z.string(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    cta: z.object({
      text: z.string(),
      href: z.string(),
    }).optional(),
  }),
  z.object({
    type: z.literal("text"),
    content: z.string(), // Markdown or HTML
  }),
  z.object({
    type: z.literal("cards"),
    title: z.string().optional(),
    cards: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      href: z.string().optional(),
    })),
  }),
  z.object({
    type: z.literal("gallery"),
    albumId: z.string(),
    limit: z.number().optional(),
  }),
  z.object({
    type: z.literal("schedule"),
    items: z.array(z.object({
      time: z.string(),
      title: z.string(),
      description: z.string().optional(),
    })),
  }),
])

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.object({
    sections: z.array(sectionSchema),
  }),
  seoTitle: z.string().max(70).optional(),
  seoDesc: z.string().max(160).optional(),
  isPublished: z.boolean(),
})

export type PageSection = z.infer<typeof sectionSchema>
export type PageContent = { sections: PageSection[] }
```

```typescript
// lib/actions/pages.ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireEditor } from "@/lib/auth"
import { updatePageSchema } from "@/lib/validators/page"

export async function updatePage(pageId: string, formData: FormData) {
  await requireEditor()

  const rawData = {
    title: formData.get("title"),
    content: JSON.parse(formData.get("content") as string),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDesc: formData.get("seoDesc") || undefined,
    isPublished: formData.get("isPublished") === "true",
  }

  const validated = updatePageSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  const page = await db.page.update({
    where: { id: pageId },
    data: validated.data,
    include: { year: true },
  })

  revalidatePath(`/${page.year.year}/${page.slug}`)
  revalidatePath("/admin/stranky")

  return { success: true, data: page }
}

export async function getPageForEdit(pageId: string) {
  await requireEditor()

  return db.page.findUnique({
    where: { id: pageId },
    include: { year: true },
  })
}
```

---

## 6. MUI Theme

```typescript
// styles/theme.ts
"use client"

import { createTheme, ThemeOptions } from "@mui/material/styles"
import { csCZ } from "@mui/material/locale"

const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",      // Adjust to your brand
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#9c27b0",
      light: "#ba68c8",
      dark: "#7b1fa2",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // No UPPERCASE
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
  },
}

export const theme = createTheme(themeOptions, csCZ)
```

```typescript
// app/layout.tsx
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { theme } from "@/styles/theme"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
```

---

## 7. Components

### 7.1 Admin Layout

```typescript
// components/admin/AdminLayout.tsx
"use client"

import { useState } from "react"
import { Box, Toolbar } from "@mui/material"
import { AdminAppBar } from "./AdminAppBar"
import { AdminDrawer } from "./AdminDrawer"

const DRAWER_WIDTH = 260

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AdminAppBar
        drawerWidth={DRAWER_WIDTH}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
      />
      <AdminDrawer
        width={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          backgroundColor: "background.default",
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  )
}
```

```typescript
// components/admin/AdminDrawer.tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from "@mui/material"
import {
  Dashboard,
  CalendarMonth,
  Article,
  Newspaper,
  PhotoLibrary,
  People,
} from "@mui/icons-material"

const menuItems = [
  { text: "Dashboard", href: "/admin", icon: Dashboard },
  { text: "Years", href: "/admin/rocniky", icon: CalendarMonth },
  { text: "Pages", href: "/admin/stranky", icon: Article },
  { text: "News", href: "/admin/novinky", icon: Newspaper },
  { text: "Gallery", href: "/admin/galerie", icon: PhotoLibrary },
  { divider: true },
  { text: "Users", href: "/admin/uzivatele", icon: People, roles: ["SUPER_ADMIN"] },
]

interface AdminDrawerProps {
  width: number
  mobileOpen: boolean
  onClose: () => void
}

export function AdminDrawer({ width, mobileOpen, onClose }: AdminDrawerProps) {
  const pathname = usePathname()

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="h6" fontWeight="bold">
          Helmac Admin
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item, index) => {
          if ("divider" in item) {
            return <Divider key={index} sx={{ my: 1 }} />
          }

          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href))

          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "inherit",
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
      {/* Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { width, boxSizing: "border-box" },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}
```

### 7.2 Public Components

```typescript
// components/ui/Header.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Container,
} from "@mui/material"
import { Menu as MenuIcon } from "@mui/icons-material"

const navItems = [
  { label: "Uvod", href: "" },
  { label: "Program", href: "/program" },
  { label: "Registrace", href: "/registrace" },
  { label: "Pravidla", href: "/pravidla" },
  { label: "Galerie", href: "/galerie" },
  { label: "Na pamatku", href: "/na-pamatku" },
  { label: "Novinky", href: "/novinky" },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const params = useParams()
  const year = params.year as string

  return (
    <AppBar position="sticky">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={Link}
            href={`/${year}`}
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "inherit",
              fontWeight: "bold",
            }}
          >
            Helmac {year}
          </Typography>

          {/* Desktop navigation */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={`/${year}${item.href}`}
                color="inherit"
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        <Box sx={{ width: 250 }}>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component={Link}
                  href={`/${year}${item.href}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  )
}
```

---

## 8. Pages

### 8.1 Public Page with Dynamic Content

```typescript
// app/(public)/[year]/[slug]/page.tsx
import { notFound } from "next/navigation"
import { Container } from "@mui/material"
import { db } from "@/lib/db"
import { PageRenderer } from "@/components/PageRenderer"

interface PageProps {
  params: { year: string; slug: string }
}

export default async function DynamicPage({ params }: PageProps) {
  const yearNum = parseInt(params.year)

  if (isNaN(yearNum)) {
    notFound()
  }

  const page = await db.page.findFirst({
    where: {
      slug: params.slug,
      year: { year: yearNum },
      isPublished: true,
    },
  })

  if (!page) {
    notFound()
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageRenderer content={page.content as any} />
    </Container>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const yearNum = parseInt(params.year)

  const page = await db.page.findFirst({
    where: {
      slug: params.slug,
      year: { year: yearNum },
    },
  })

  if (!page) return {}

  return {
    title: page.seoTitle || page.title,
    description: page.seoDesc,
  }
}
```

### 8.2 Admin Page - Year List

```typescript
// app/admin/rocniky/page.tsx
import Link from "next/link"
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Box,
} from "@mui/material"
import { Add, Archive, CheckCircle } from "@mui/icons-material"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { SetActiveButton, ArchiveButton } from "./actions"

export default async function YearsPage() {
  await requireAdmin()

  const years = await db.year.findMany({
    orderBy: { year: "desc" },
    include: {
      _count: {
        select: { pages: true, news: true, albums: true },
      },
    },
  })

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Years</Typography>
        <Button
          component={Link}
          href="/admin/rocniky/novy"
          variant="contained"
          startIcon={<Add />}
        >
          New Year
        </Button>
      </Box>

      <Grid container spacing={3}>
        {years.map((year) => (
          <Grid item xs={12} sm={6} md={4} key={year.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography variant="h5">{year.title}</Typography>
                  {year.isActive && (
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                      icon={<CheckCircle />}
                    />
                  )}
                  {year.isArchived && (
                    <Chip
                      label="Archive"
                      color="default"
                      size="small"
                      icon={<Archive />}
                    />
                  )}
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {year.subtitle}
                </Typography>
                <Typography variant="body2">
                  {year._count.pages} pages • {year._count.news} news • {year._count.albums} albums
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  href={`/admin/rocniky/${year.id}`}
                  size="small"
                >
                  Edit
                </Button>
                {!year.isActive && (
                  <SetActiveButton yearId={year.id} />
                )}
                {!year.isActive && !year.isArchived && (
                  <ArchiveButton yearId={year.id} />
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
```

---

## 9. Image Upload

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { requireEditor } from "@/lib/auth"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    await requireEditor()
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Type validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 400 }
    )
  }

  // Size validation
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 5MB)" },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Unique filename
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const fileName = `${timestamp}-${safeName}`

  // Save to public/uploads
  const uploadDir = join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)

  return NextResponse.json({
    url: `/uploads/${fileName}`,
    name: file.name,
    size: file.size,
    type: file.type,
  })
}
```

> **Production Note:** Use cloud storage (Cloudflare R2, AWS S3, or Vercel Blob) instead of local filesystem. Local `public/uploads` only works for development.

---

## 10. Security Checklist

### Pre-Launch Checklist

| Area | Check | Status |
|------|-------|--------|
| **Env variables** | No secrets in code, only in .env | ⬜ |
| **NEXTAUTH_SECRET** | Min 32 chars, randomly generated | ⬜ |
| **DATABASE_URL** | Server-only, not NEXT_PUBLIC_ | ⬜ |
| **Passwords** | Hashed with Argon2, min 8 chars | ⬜ |
| **Session cookies** | httpOnly, secure, sameSite | ⬜ |
| **CSRF** | Covered by Auth.js + Server Actions | ⬜ |
| **Input validation** | Zod on all inputs | ⬜ |
| **File upload** | Type, size, filename sanitization | ⬜ |
| **SQL injection** | Only Prisma (never raw SQL with input) | ⬜ |
| **XSS** | React escaping, sanitize rich text | ⬜ |
| **Rate limiting** | On login endpoint | ⬜ |
| **HTTPS** | Required in production | ⬜ |
| **CSP headers** | Set in next.config.js | ⬜ |
| **Error handling** | Don't expose stacktrace to users | ⬜ |

### next.config.js Security Headers

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## 11. Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/helmac?schema=public"

# Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App
NODE_ENV="development"
```

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## 12. Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import argon2 from "argon2"

const prisma = new PrismaClient()

async function main() {
  // Create super admin
  const passwordHash = await argon2.hash("admin123456")

  const admin = await prisma.user.upsert({
    where: { email: "admin@helmac.cz" },
    update: {},
    create: {
      email: "admin@helmac.cz",
      name: "Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  })

  console.log("Created admin user:", admin.email)

  // Create first year
  const year = await prisma.year.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      title: "Helmac 2025",
      isActive: true,
    },
  })

  console.log("Created year:", year.title)

  // Create default pages
  const defaultPages = [
    { slug: "uvod", title: "Uvod", sortOrder: 0 },
    { slug: "program", title: "Program", sortOrder: 1 },
    { slug: "registrace", title: "Registrace", sortOrder: 2 },
    { slug: "pravidla", title: "Pravidla", sortOrder: 3 },
    { slug: "galerie", title: "Galerie", sortOrder: 4 },
    { slug: "na-pamatku", title: "Na pamatku", sortOrder: 5 },
  ]

  for (const page of defaultPages) {
    await prisma.page.upsert({
      where: {
        yearId_slug: {
          yearId: year.id,
          slug: page.slug,
        },
      },
      update: {},
      create: {
        ...page,
        yearId: year.id,
        content: { sections: [] },
        isPublished: true,
      },
    })
  }

  console.log("Created default pages")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

```json
// package.json - add this
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## 13. Testing (Playwright)

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
})
```

```typescript
// tests/auth.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Admin Authentication", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/admin/login")

    await page.fill('input[name="email"]', "admin@helmac.cz")
    await page.fill('input[name="password"]', "admin123456")
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL("/admin")
    await expect(page.locator("text=Dashboard")).toBeVisible()
  })

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/admin/login")

    await page.fill('input[name="email"]', "admin@helmac.cz")
    await page.fill('input[name="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    await expect(page.locator("text=Invalid credentials")).toBeVisible()
  })
})
```

---

## 14. Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables:
   - `DATABASE_URL` (from Neon/Supabase)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (production URL)
4. Build command: `prisma generate && prisma migrate deploy && next build`

### PostgreSQL Hosting

| Service | Free tier | Notes |
|---------|-----------|-------|
| Neon | 0.5 GB | Serverless, good integration |
| Supabase | 500 MB | + Free Auth, Storage |
| Railway | $5 credit | Simple setup |
| Render | 90 days | Then paid |

---

## 15. Implementation Order

```
Phase 1: Foundation (1-2 days)
├── 1.1 Next.js + TypeScript setup
├── 1.2 MUI integration + theme
├── 1.3 Prisma schema + migrations
└── 1.4 Seed script

Phase 2: Authentication (1 day)
├── 2.1 Auth.js configuration
├── 2.2 Login page
├── 2.3 Middleware
└── 2.4 Session helpers

Phase 3: Admin Basics (1-2 days)
├── 3.1 Admin layout (Drawer, AppBar)
├── 3.2 Dashboard
├── 3.3 Year CRUD
└── 3.4 Role-based access

Phase 4: Content Management (2-3 days)
├── 4.1 Page editing
├── 4.2 Section editor (JSON content)
├── 4.3 News CRUD
├── 4.4 Image upload
└── 4.5 Gallery/albums

Phase 5: Public Website (2-3 days)
├── 5.1 Public layout (Header, Footer)
├── 5.2 Dynamic pages from DB
├── 5.3 PageRenderer component
├── 5.4 News list
└── 5.5 Year archive

Phase 6: Finalization (1-2 days)
├── 6.1 SEO meta tags
├── 6.2 Security headers
├── 6.3 Error pages
├── 6.4 Playwright tests
├── 6.5 Deployment
└── 6.6 Documentation
```

---

## Summary

This plan covers:

- Modern tech stack (Next.js 14, TypeScript, MUI, Prisma, PostgreSQL)
- Year management with archive functionality
- CMS-like content editing (pages, news, gallery)
- Role-based admin access (SUPER_ADMIN, ADMIN, EDITOR)
- Secure authentication (Argon2, JWT sessions)
- Server-only DB access
- Input validation (Zod)
- Czech language site
- Testing strategy
- Deployment plan

**Remember to change the admin password before deploying to production!**
