import connectDB from "./database";
import sessions from "./models/sessions";
import { verify } from "jsonwebtoken";

export async function validateTokenDB(id: string): Promise<String | null> {
    if (!id) {
        console.error("Token not provided");
        return null;
    }
    await connectDB();

    const secretKey = process.env.NEXTAUTH_SECRET ?? "";
    let session = null

    try {
        session = await sessions.findById(id);
        if (session && session.token) {
            const decode = verify(session.token, secretKey);
            return session.token;
        }
    } catch (error) {
        console.log(error);
        return null;
    }

    return null;
}