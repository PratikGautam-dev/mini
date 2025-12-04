import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user) {
                    // Create user if not exists (Auto-signup for demo)
                    const newUser = await prisma.user.create({
                        data: {
                            email: credentials.email,
                            password: credentials.password, // In prod, hash this!
                            role: (credentials.email.includes("admin") || credentials.email === "pratik@gmail.com") ? "ADMIN" : "USER"
                        }
                    })
                    return { id: newUser.id, email: newUser.email, role: newUser.role }
                }

                // Force upgrade to ADMIN if it's the specific email
                if (user.email === "pratik@gmail.com" && user.role !== "ADMIN") {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { role: "ADMIN" }
                    });
                    user.role = "ADMIN";
                }

                if (user.password === credentials.password) {
                    return { id: user.id, email: user.email, role: user.role }
                }

                return null
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role
            }
            return token
        },
        async session({ session, token }: any) {
            if (session?.user) {
                session.user.role = token.role
            }
            return session
        }
    },
    pages: {
        signIn: '/auth/signin',
    }
})

export { handler as GET, handler as POST }
