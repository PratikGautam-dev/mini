import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
                    return null
                }

                // Force upgrade to ADMIN if it's the specific email
                if (user.email === "pratik@gmail.com" && user.role !== "ADMIN") {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { role: "ADMIN" }
                    });
                    user.role = "ADMIN";
                }

                // Check password
                // For legacy plain text passwords (optional backward compatibility if needed, 
                // but for this task we assume migration to hashed)
                // We will try bcrypt compare first.

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (isValid) {
                    return { id: user.id, email: user.email, role: user.role }
                }

                // Fallback for existing plain text passwords (TEMPORARY/OPTIONAL)
                // If bcrypt fails, check if it matches plain text (only if not a hash)
                // A bcrypt hash starts with $2a$ or $2b$ or $2y$ and is 60 chars.
                // If current password is not a hash, compare directly.
                if (!user.password.startsWith("$2")) {
                    if (user.password === credentials.password) {
                        // Optionally migrate to hash here
                        const hashedPassword = await bcrypt.hash(credentials.password, 10);
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { password: hashedPassword }
                        });
                        return { id: user.id, email: user.email, role: user.role }
                    }
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
