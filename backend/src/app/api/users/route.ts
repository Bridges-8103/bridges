import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/modules/users/user.service";

export async function GET() {
  try {
    const users = await UserService.getUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required and must be a string." },
        { status: 400 }
      );
    }

    const existing = await UserService.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const user = await UserService.createUser({ email, name });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
