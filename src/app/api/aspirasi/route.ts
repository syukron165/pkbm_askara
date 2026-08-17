import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const privacyLevel = searchParams.get("privacyLevel");

    const where: Record<string, unknown> = {};

    // Siswa/Orang tua hanya lihat tiket mereka sendiri
    if (["siswa", "orang_tua"].includes(user.role)) {
      where.senderId = user.id;
    }

    // Admin: filter publik/privat; privat default visible
    if (privacyLevel) where.privacyLevel = privacyLevel;
    if (category) where.category = category;
    if (status) where.status = status;

    const tickets = await prisma.feedbackTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Mask anonim untuk admin jika flagged anonymous
    const safeTickets = tickets.map((t: { isAnonymous: boolean; senderId: string | null; senderName: string | null; senderClass: string | null; [key: string]: unknown }) => {
      if (t.isAnonymous && !["admin", "super_admin"].includes(user.role)) {
        return { ...t, senderId: null, senderName: "Anonim", senderClass: null };
      }
      // Admin dapat melihat nama asli bahkan jika anonim
      return t;
    });

    const stats = ["admin", "super_admin"].includes(user.role)
      ? {
          received: await prisma.feedbackTicket.count({ where: { status: "RECEIVED" } }),
          underReview: await prisma.feedbackTicket.count({ where: { status: "UNDER_REVIEW" } }),
          inAction: await prisma.feedbackTicket.count({ where: { status: "IN_ACTION" } }),
          resolved: await prisma.feedbackTicket.count({ where: { status: "RESOLVED" } }),
          avgRating:
            (
              await prisma.feedbackTicket.aggregate({
                where: { satisfactionRating: { not: null } },
                _avg: { satisfactionRating: true },
              })
            )._avg.satisfactionRating || 0,
        }
      : null;

    return NextResponse.json({ tickets: safeTickets, stats });
  } catch (error) {
    console.error("GET /api/aspirasi error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["siswa", "orang_tua"].includes(user.role)) {
      return NextResponse.json(
        { error: "Hanya siswa dan orang tua yang dapat mengirim aspirasi" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { category, subject, message, attachmentUrl, privacyLevel, isAnonymous, senderClass } =
      body;

    const ticket = await prisma.feedbackTicket.create({
      data: {
        senderType: user.role === "siswa" ? "SISWA" : "ORANG_TUA",
        senderId: isAnonymous ? null : user.id,
        senderName: isAnonymous ? null : user.name,
        senderClass,
        isAnonymous: isAnonymous || false,
        category,
        subject,
        message,
        attachmentUrl,
        privacyLevel: privacyLevel || "PRIVAT",
        status: "RECEIVED",
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("POST /api/aspirasi error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, action, responseText, newStatus, satisfactionRating, satisfactionNote } = body;

    const ticket = await prisma.feedbackTicket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });

    const updateData: Record<string, unknown> = {};

    if (action === "RESPOND") {
      if (!["admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      updateData.status = newStatus || "RESOLVED";
      updateData.responseText = responseText;
      updateData.respondedById = user.id;
      updateData.respondedAt = new Date();
    } else if (action === "UPDATE_STATUS") {
      if (!["admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      updateData.status = newStatus;
    } else if (action === "RATE") {
      // Pengirim asli yang memberi rating
      if (ticket.senderId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      updateData.satisfactionRating = satisfactionRating;
      updateData.satisfactionNote = satisfactionNote;
      updateData.ratedAt = new Date();
    }

    const updated = await prisma.feedbackTicket.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/aspirasi error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
